import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'recipes';
const RECIPE_INGREDIENTS_TABLE_NAME = 'recipe_ingredients';
const RECIPE_STEPS_TABLE_NAME = 'recipe_steps';

const RECIPE_LIST_SELECT = `
          id, 
          name,
          description, 
          genre,
          reference_url,
          dish_type,
          cooking_time,
          serving_size,
          rating,
          image_url,
          is_favorite,
          recipe_ingredients  (
            id, 
            quantity,
            ingredients (
              id,
              name,
              category_id,
              unit
            )
          ),
          recipe_steps  (
            id, 
            step_no,
            description
          )
          `;

export const useRecipesStore = defineStore('recipes', {
  state: () => {
    return {
      recipes: [] as any
    };
  },
  getters: {
    getById: (state) => {
      return (recipeId: number): any => {
        return state.recipes.find((item: any) => item.id === recipeId);
      };
    }
  },
  actions: {
    async fetchRecipes() {
      try {
        const { data, error } = await supabase.from(TABLE_NAME).select(RECIPE_LIST_SELECT);

        if (error) throw error;

        this.recipes = data.map(this.mapRow);

        // showMessage('レシピリストを取得しました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('レシピリストの取得に失敗しました。', 'error');
      }
    },

    async addRecipe(addItem: any) {
      try {
        // --- ① レシピ追加 --
        const { data: recipe, error: recipeError } = await supabase
          .from(TABLE_NAME)
          .insert([
            {
              name: addItem.name,
              description: addItem.description,
              genre: addItem.genre,
              reference_url: addItem.referenceUrl,
              dish_type: addItem.type,
              rating: addItem.rating || 0,
              image_url: addItem.imageUrl,
              is_favorite: addItem.isFavorite || false
            }
          ])
          .select('id') // 登録したレコードのIDを取得
          .single();

        if (recipeError) throw recipeError;
        const recipeId = recipe.id;

        // --- ② レシピ追加 --
        if (addItem.ingredients.length >= 0) {
          // レシピ材料テーブル追加
          const payload = addItem.ingredients.map((ri: any) => ({
            recipe_id: recipeId,
            ingredient_id: ri.id,
            quantity: ri.quantity
          }));

          const { error: ingredientsError } = await supabase
            .from(RECIPE_INGREDIENTS_TABLE_NAME)
            .insert(payload);

          if (ingredientsError) throw ingredientsError;
        }

        // --- ③ 登録データ取得 --
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select(RECIPE_LIST_SELECT)
          .eq('id', recipeId)
          .single();

        if (error) throw error;

        this.recipes.push(this.mapRow(data));
        showMessage('レシピが登録されました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('レシピの登録に失敗しました。', 'error');
        return null;
      }
    },
    async editRecipe(editItem: any) {
      try {
        const recipeId = editItem.id;

        // --- ① レシピを更新 --
        const { error: recipeError } = await supabase
          .from(TABLE_NAME)
          .update({
            name: editItem.name,
            description: editItem.description,
            genre: editItem.genre,
            reference_url: editItem.referenceUrl,
            dish_type: editItem.type,
            cooking_time: editItem.cookingTime,
            serving_size: editItem.servingSize,
            rating: editItem.rating,
            image_url: editItem.imageUrl,
            is_favorite: editItem.isFavorite
          })
          .eq('id', recipeId);

        if (recipeError) throw recipeError;

        // --- ② レシピ材料を一旦削除 ---
        await supabase.from(RECIPE_INGREDIENTS_TABLE_NAME).delete().eq('recipe_id', recipeId);

        // --- ③ レシピ追加 --
        if (editItem.ingredients.length >= 0) {
          // レシピ材料テーブル追加
          const payload = editItem.ingredients.map((ri: any) => ({
            recipe_id: recipeId,
            ingredient_id: ri.id,
            quantity: ri.quantity
          }));

          const { error: ingredientsError } = await supabase
            .from(RECIPE_INGREDIENTS_TABLE_NAME)
            .insert(payload);

          if (ingredientsError) throw ingredientsError;
        }

        // --- ④ 更新データ取得 --
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select(RECIPE_LIST_SELECT)
          .eq('id', recipeId)
          .single();

        if (error) throw error;

        // ローカルキャッシュを更新
        const updateBalance = this.getById(recipeId);

        Object.assign(updateBalance, this.mapRow(data));

        showMessage('レシピが更新されました。', 'success');
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('レシピの更新に失敗しました。', 'error');
        return null;
      }
    },
    async toggleFavorite(recipeId: number) {
      try {
        const recipe = this.getById(recipeId);
        if (!recipe) return;

        const nextStatus = !recipe.isFavorite;

        const { error } = await supabase
          .from(TABLE_NAME)
          .update({ is_favorite: nextStatus })
          .eq('id', recipeId);

        if (error) throw error;

        recipe.isFavorite = nextStatus;
        // showMessage(nextStatus ? 'お気に入りに追加しました。' : 'お気に入りから外しました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('お気に入りの作成に失敗しました。', 'error');
      }
    },
    async editRecipeIngredients(recipeId: number, editItem: any) {
      try {
        // --- ① レシピ材料を一旦削除 ---
        await supabase.from(RECIPE_INGREDIENTS_TABLE_NAME).delete().eq('recipe_id', recipeId);

        // --- ② レシピ追加 --
        if (editItem.ingredients.length >= 0) {
          // レシピ材料テーブル追加
          const payload = editItem.ingredients.map((ri: any) => ({
            recipe_id: recipeId,
            ingredient_id: ri.id,
            quantity: ri.quantity
          }));

          const { error: ingredientsError } = await supabase
            .from(RECIPE_INGREDIENTS_TABLE_NAME)
            .insert(payload);

          if (ingredientsError) throw ingredientsError;
        }

        // --- ④ 更新データ取得 --
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select(RECIPE_LIST_SELECT)
          .eq('id', recipeId)
          .single();

        if (error) throw error;

        // ローカルキャッシュを更新
        const updateBalance = this.getById(recipeId);

        Object.assign(updateBalance, this.mapRow(data));

        showMessage('レシピが更新されました。', 'success');
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('レシピの更新に失敗しました。', 'error');
        return null;
      }
    },
    async editRecipeSteps(recipeId: number, steps: any[]) {
      try {
        // --- ① レシピ手順を一旦削除 ---
        await supabase.from(RECIPE_STEPS_TABLE_NAME).delete().eq('recipe_id', recipeId);

        // --- ② 手順を追加 ---
        if (steps.length > 0) {
          const payload = steps.map((s: any, index: number) => ({
            recipe_id: recipeId,
            step_no: index + 1,
            description: s.description
          }));

          const { error: stepsError } = await supabase.from(RECIPE_STEPS_TABLE_NAME).insert(payload);
          if (stepsError) throw stepsError;
        }

        // --- ③ 更新データ取得 --
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select(RECIPE_LIST_SELECT)
          .eq('id', recipeId)
          .single();

        if (error) throw error;

        // ローカルキャッシュを更新
        const updateRecipe = this.getById(recipeId);
        Object.assign(updateRecipe, this.mapRow(data));

        showMessage('手順が更新されました。', 'success');
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('手順の更新に失敗しました。', 'error');
        return null;
      }
    },
    async uploadImage(file: File) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath);

        return data.publicUrl;
      } catch (error) {
        console.error('Error:', error);
        showMessage('画像のアップロードに失敗しました。', 'error');
        return null;
      }
    },
    async deleteRecipe(recipeId: string) {
      try {
        // --- レシピ材料テーブルを先に削除 ---
        const { error: recipeIngredientsError } = await supabase
          .from(RECIPE_INGREDIENTS_TABLE_NAME)
          .delete()
          .eq('recipe_id', recipeId);

        if (recipeIngredientsError) throw recipeIngredientsError;

        // --- レシピテーブルを先に削除 ---
        const { error: recipeStepsError } = await supabase
          .from(RECIPE_STEPS_TABLE_NAME)
          .delete()
          .eq('recipe_id', recipeId);
        
        if (recipeStepsError) throw recipeStepsError;

        // --- レシピテーブルを削除 ---
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', recipeId);
        if (error) throw error;

        const indexToDelete = this.recipes.findIndex((item: any) => item.id === recipeId);
        if (indexToDelete !== -1) {
          this.recipes.splice(indexToDelete, 1);
        }
        showMessage('レシピが削除されました。', 'success');
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('レシピの削除に失敗しました。', 'error');
      }
    },

    /**
     * CSVインポート
     */
    async importRecipes(csvData: any[]) {
      try {
        // 1. 材料情報を一括取得（マッピング用）
        const { data: ingredients } = await supabase.from('ingredients').select('id, name');
        const { data: aliases } = await supabase.from('ingredient_aliases').select('id, name, ingredient_id');
        
        const ingMap: Record<string, string> = {};
        ingredients?.forEach(i => { ingMap[i.name] = i.id; });
        aliases?.forEach(a => { ingMap[a.name] = a.ingredient_id; });

        for (const item of csvData) {
          // 2. レシピ本体の作成
          const { data: recipe, error: recipeError } = await supabase
            .from(TABLE_NAME)
            .insert({
              name: item.name,
              dish_type: item.type,
              genre: item.genre,
              cooking_time: item.cookingTime ? Number(item.cookingTime) : null,
              serving_size: item.servingSize ? Number(item.servingSize) : 2,
              rating: item.rating ? Number(item.rating) : 0,
              reference_url: item.referenceUrl,
              description: item.description
            })
            .select()
            .single();

          if (recipeError) {
            console.error('Recipe Error:', recipeError);
            continue;
          }

          // 3. 材料リストのパースと登録
          if (item.ingredients) {
            const riList = item.ingredients.split('|');
            const riPayload = [];
            
            for (const riStr of riList) {
              const [name, qty] = riStr.split(':');
              if (!name) continue;

              let ingId = ingMap[name.trim()];
              
              // 材料がなければ新規作成
              if (!ingId) {
                const { data: newIng } = await supabase
                  .from('ingredients')
                  .insert({ name: name.trim(), category_id: 7 }) // 未分類
                  .select()
                  .single();
                if (newIng) {
                  ingId = newIng.id;
                  ingMap[name.trim()] = ingId;
                }
              }

              if (ingId) {
                riPayload.push({
                  recipe_id: recipe.id,
                  ingredient_id: ingId,
                  quantity: qty || ''
                });
              }
            }
            if (riPayload.length > 0) {
              await supabase.from(RECIPE_INGREDIENTS_TABLE_NAME).insert(riPayload);
            }
          }

          // 4. 手順リストのパースと登録
          if (item.steps) {
            const stepList = item.steps.split('|');
            const stepPayload = stepList.map((sDesc: string, idx: number) => ({
              recipe_id: recipe.id,
              step_no: idx + 1,
              description: sDesc.trim()
            })).filter((s: any) => s.description);

            if (stepPayload.length > 0) {
              await supabase.from(RECIPE_STEPS_TABLE_NAME).insert(stepPayload);
            }
          }
        }

        // 全件再取得
        await this.fetchRecipes();
        showMessage('レシピのインポートが完了しました。', 'success');
      } catch (error) {
        console.error('Import Error:', error);
        showMessage('レシピのインポートに失敗しました。', 'error');
      }
    },
    mapRow(row: any) {
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        genre: row.genre,
        referenceUrl: row.reference_url,
        type: row.dish_type,
        cookingTime: row.cooking_time,
        servingSize: row.serving_size,
        rating: row.rating,
        imageUrl: row.image_url,
        isFavorite: row.is_favorite,

        ingredients: row.recipe_ingredients.map((ri: any) => ({
          id: ri.ingredients.id,
          quantity: ri.quantity,
          name: ri.ingredients.name,
          unit: ri.ingredients.unit,
          categoryId: ri.ingredients.category_id
        })),
        steps: row.recipe_steps
          .sort((a: any, b: any) => a.step_no - b.step_no)
          .map((ri: any) => ({
            id: ri.id,
            stepNo: ri.step_no,
            description: ri.description
          }))
      };
    }
  }
});
