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

        const { data, error } = await supabase.from(TABLE_NAME).select();

        if (error) throw error;

        this.ingredients = data;
        // this.balances.sort((a: any, b: any) => dayjs(b.balance_date).diff(dayjs(a.balance_date)));
        // showMessage('材料を取得しました。', 'success');
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
          .select();

        if (error) throw error;

        this.ingredients.push(data[0]);
        showMessage('材料が登録されました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('材料の登録に失敗しました。', 'error');
        return null;
      }
    },
    async editIngredient(editItem: any) {
      try {
        const ingredientId = editItem.id;
        const { error } = await supabase
          .from(TABLE_NAME)
          .update({
            name: editItem.name,
            category_id: editItem.categoryId,
            unit: editItem.unit
          })
          .eq('id', ingredientId);

        if (error) throw error;

        // ローカルキャッシュを更新
        const updateBalance = this.getById(ingredientId);

        Object.assign(updateBalance, { ...editItem, category_id: editItem.categoryId });

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
    }
  }
});
