import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'ingredient_categories';

export const useIngredientCategoriesStore = defineStore('ingredientCategories', {
  state: () => {
    return {
      ingredientCategories: [] as any
    };
  },
  getters: {
    getById: (state) => {
      return (ingredientId: string): any => {
        return state.ingredientCategories.find((item: any) => item.id === ingredientId);
      };
    }
  },
  actions: {
    async fetchIngredientCategories() {
      try {
        // すでにデータがあるなら何もしない
        if (this.ingredientCategories.length > 0) return;

        const { data, error } = await supabase.from(TABLE_NAME).select(`
          id,
          name
        `);

        if (error) throw error;

        this.ingredientCategories = data;
      } catch (error) {
        console.error('Error:', error);
        showMessage('材料の取得に失敗しました。', 'error');
      }
    }
  }
});
