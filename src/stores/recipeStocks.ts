import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'recipe_stocks';

export const useRecipeStocksStore = defineStore('recipeStocks', {
  state: () => {
    return {
      stocks: [] as any[]
    };
  },
  actions: {
    async fetchStocks() {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        this.stocks = data;
      } catch (error) {
        console.error('Error:', error);
        showMessage('ストックリストの取得に失敗しました。', 'error');
      }
    },

    async addStock(title: string, url: string, memo: string) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([{ title, url, memo }])
          .select()
          .single();

        if (error) throw error;
        this.stocks.unshift(data);
        showMessage('ストックに追加しました。', 'success');
        return data;
      } catch (error) {
        console.error('Error:', error);
        showMessage('ストックの追加に失敗しました。', 'error');
        return null;
      }
    },

    async deleteStock(id: string) {
      try {
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
        if (error) throw error;

        this.stocks = this.stocks.filter((s) => s.id !== id);
        showMessage('ストックを削除しました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('ストックの削除に失敗しました。', 'error');
      }
    }
  }
});
