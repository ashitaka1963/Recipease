import axios from 'axios';

export interface ImportedRecipe {
  name: string;
  description: string;
  type: string;
  genre: string;
  cookingTime: number;
  servingSize: number;
  imageUrl: string;
  referenceUrl: string;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
}

export class RecipeImportService {
  /**
   * URLからレシピ情報を取得する
   */
  static async fetchFromUrl(url: string): Promise<ImportedRecipe | null> {
    try {
      // CORS回避のために AllOrigins プロキシを使用
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl);
      
      if (!response.data || !response.data.contents) {
        throw new Error('Failed to fetch content from proxy');
      }

      const html = response.data.contents;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // JSON-LD を探す
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      let recipeData: any = null;

      for (const script of Array.from(jsonLdScripts)) {
        try {
          const data = JSON.parse(script.textContent || '');
          
          // data が配列の場合や @graph 形式の場合がある
          const findRecipe = (obj: any): any => {
            if (obj['@type'] === 'Recipe' || obj['@type']?.includes('Recipe')) {
              return obj;
            }
            if (obj['@graph']) {
              return obj['@graph'].find((item: any) => item['@type'] === 'Recipe' || item['@type']?.includes('Recipe'));
            }
            if (Array.isArray(obj)) {
               return obj.find((item: any) => item['@type'] === 'Recipe' || item['@type']?.includes('Recipe'));
            }
            return null;
          };

          recipeData = findRecipe(data);
          if (recipeData) break;
        } catch (e) {
          continue;
        }
      }

      if (!recipeData) {
        // フォールバック: メタデータから最低限の情報を取得
        return this.parseFromMeta(doc, url);
      }

      return this.mapJsonLdToRecipe(recipeData, url);
    } catch (error) {
      console.error('Import Error:', error);
      return null;
    }
  }

  /**
   * JSON-LD データをアプリ用の形式に変換
   */
  private static mapJsonLdToRecipe(data: any, url: string): ImportedRecipe {
    // 調理時間のパース (ISO 8601 duration, e.g., PT20M)
    const parseDuration = (iso: string): number => {
      if (!iso) return 0;
      const match = iso.match(/PT(\d+)M/);
      return match ? parseInt(match[1]) : 0;
    };

    // 材料のパース
    const recipeIngredient = data.recipeIngredient;
    const ingredients = (Array.isArray(recipeIngredient) ? recipeIngredient : (recipeIngredient ? [recipeIngredient] : []))
      .filter(Boolean)
      .map((item: string) => {
        // "材料名 数量" または "材料名:数量" を想定
        const parts = item.split(/[ \u3000:]/);
        if (parts.length > 1) {
          const qty = parts.pop() || '';
          const name = parts.join(' ').trim();
          return { name, quantity: qty };
        }
        return { name: item.trim(), quantity: '' };
      });

    // 手順のパース
    const recipeInstructions = data.recipeInstructions;
    const steps = (Array.isArray(recipeInstructions) ? recipeInstructions : (recipeInstructions ? [recipeInstructions] : []))
      .filter(Boolean)
      .map((s: any) => {
        if (typeof s === 'string') return s;
        if (s.text) return s.text;
        if (s['@type'] === 'HowToStep') return s.text;
        return '';
      })
      .filter(Boolean);

    // 画像の取得
    let imageUrl = '';
    if (data.image) {
      if (typeof data.image === 'string') imageUrl = data.image;
      else if (Array.isArray(data.image)) imageUrl = data.image[0];
      else if (data.image.url) imageUrl = data.image.url;
    }

    return {
      name: data.name || '',
      description: data.description || '',
      type: '主菜', // デフォルト
      genre: 'その他',
      cookingTime: parseDuration(data.totalTime || data.prepTime || data.cookTime),
      servingSize: parseInt(data.recipeYield) || 2,
      imageUrl: imageUrl,
      referenceUrl: url,
      ingredients,
      steps
    };
  }

  /**
   * JSON-LD が見つからない場合のフォールバック
   */
  private static parseFromMeta(doc: Document, url: string): ImportedRecipe {
    const title = doc.querySelector('title')?.textContent || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

    return {
      name: title.split(/[-|]/)[0].trim(),
      description,
      type: '主菜',
      genre: 'その他',
      cookingTime: 0,
      servingSize: 2,
      imageUrl: image,
      referenceUrl: url,
      ingredients: [],
      steps: []
    };
  }
}
