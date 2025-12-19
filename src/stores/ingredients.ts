import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'ingredients';

export const useIngredientsStore = defineStore('ingredients', {
  state: () => {
    return {
      ingredients: [] as any
    };
  },
  getters: {
    getById: (state) => {
      return (ingredientId: string): any => {
        return state.ingredients.find((item: any) => item.id === ingredientId);
      };
    }
  },
  actions: {
    async fetchIngredients() {
      try {
        // すでにデータがあるなら何もしない
        if (this.ingredients.length > 0) return;

        const { data, error } = await supabase.from(TABLE_NAME).select(`
          id,
          name,
          category_id,
          unit,
          ingredient_categories (
            id,
            name,
            background_color,
            text_color
          ),
          ingredient_aliases (
            id,
            name
          )
        `);

        if (error) throw error;

        this.ingredients = data.map(this.mapRow);
      } catch (error) {
        console.error('Error:', error);
        showMessage('材料の取得に失敗しました。', 'error');
      }
    },

    async addIngredient(addItem: any) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([
            {
              name: addItem.name,
              category_id: addItem.categoryId,
              unit: addItem.unit
            }
          ])
          .select(`
            id,
            name,
            category_id,
            unit,
            ingredient_categories (
              id,
              name,
              background_color,
              text_color
            ),
            ingredient_aliases (
              id,
              name
            )
          `)
          .single();

        if (error) throw error;

        const newIngredient = this.mapRow(data);
        this.ingredients.push(newIngredient);
        showMessage('材料が登録されました。', 'success');
        return newIngredient;
      } catch (error) {
        console.error('Error:', error);
        showMessage('材料の登録に失敗しました。', 'error');
        return null;
      }
    },
    async editIngredient(editItem: any) {
      try {
        const ingredientId = editItem.id;
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update({
            name: editItem.name,
            category_id: editItem.categoryId,
            unit: editItem.unit
          })
          .eq('id', ingredientId)
          .select(`
            id,
            name,
            category_id,
            unit,
            ingredient_categories (
              id,
              name,
              background_color,
              text_color
            ),
            ingredient_aliases (
              id,
              name
            )
          `)
          .single();

        if (error) throw error;

        // ローカルキャッシュを更新
        const updateBalance = this.getById(ingredientId);

        Object.assign(updateBalance, this.mapRow(data));

        showMessage('材料が更新されました。', 'success');
        return editItem;
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('材料の更新に失敗しました。', 'error');
        return null;
      }
    },
    async deleteIngredient(ingredientId: string) {
      try {
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', ingredientId);
        if (error) throw error;

        const indexToDelete = this.ingredients.findIndex((item: any) => item.id === ingredientId);
        if (indexToDelete !== -1) {
          this.ingredients.splice(indexToDelete, 1);
        }
        showMessage('材料が削除されました。', 'success');
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('材料の削除に失敗しました。', 'error');
      }
    },
    async addAlias(ingredientId: string, name: string) {
      try {
        const { data, error } = await supabase
          .from('ingredient_aliases')
          .insert([{ ingredient_id: ingredientId, name }])
          .select()
          .single();

        if (error) throw error;

        const ingredient = this.getById(ingredientId);
        if (ingredient) {
          if (!ingredient.aliases) ingredient.aliases = [];
          ingredient.aliases.push({ id: data.id, name: data.name });
        }
      } catch (error) {
        console.error('Error:', error);
        showMessage('別名の追加に失敗しました。', 'error');
      }
    },
    async deleteAlias(ingredientId: string, aliasId: string) {
      try {
        const { error } = await supabase.from('ingredient_aliases').delete().eq('id', aliasId);

        if (error) throw error;

        const ingredient = this.getById(ingredientId);
        if (ingredient && ingredient.aliases) {
          const index = ingredient.aliases.findIndex((a: any) => a.id === aliasId);
          if (index !== -1) ingredient.aliases.splice(index, 1);
        }
      } catch (error) {
        console.error('Error:', error);
        showMessage('別名の削除に失敗しました。', 'error');
      }
    },
    mapRow(row: any) {
      return {
        id: row.id,
        name: row.name,
        categoryId: row.category_id,
        categoryName: row.ingredient_categories.name,
        backgroundColor: row.ingredient_categories.background_color,
        textColor: row.ingredient_categories.text_color,
        unit: row.unit,
        aliases: row.ingredient_aliases || []
      };
    }
  }
});
