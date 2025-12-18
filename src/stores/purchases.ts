import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'purchases';

export const usePurchasesStore = defineStore('purchases', {
  state: () => {
    return {
      purchases: [] as any
    };
  },
  getters: {
    getById: (state) => {
      return (purchaseId: string): any => {
        return state.purchases.find((item: any) => item.id === purchaseId);
      };
    }
  },
  actions: {
    async fetchPurchases() {
      // TODO:RLS

      try {
        const { data, error } = await supabase.from(TABLE_NAME).select(`
            id, 
            quantity, 
            is_purchased,
            memo,
            ingredients (
              id, 
              name, 
              unit,
              ingredient_categories (
                id,
                name,
                background_color,
                text_color
              )
            )
            `);

        console.log(data);

        if (error) throw error;

        this.purchases = data.map(this.mapRow);

        // showMessage('買い物リストを取得しました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('買い物リストの取得に失敗しました。', 'error');
      }
    },

    async addPurchase(addItem: any) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([
            {
              ingredient_id: addItem.ingredientId,
              quantity: addItem.quantity,
              is_purchased: addItem.isPurchased,
              memo: addItem.memo
            }
          ])
          .select(
            `
            id, 
            quantity, 
            is_purchased,
            memo,
            ingredients (
              id, 
              name, 
              unit,
              ingredient_categories (
                id,
                name,
                background_color,
                text_color
              )
            )
            `
          )
          .single();
        if (error) throw error;

        this.purchases.push(this.mapRow(data));
        showMessage('買い物リストに追加されました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('買い物リストの追加に失敗しました。', 'error');
        return null;
      }
    },
    async addPurchases(addItems: any) {
      try {
        const payload = addItems.map((ingredient: any) => ({
          ingredient_id: ingredient.id,
          quantity: ingredient.quantity,
          is_purchased: false,
          memo: ingredient.memo
        }));

        console.log(payload);

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert(payload)
          .select(
            `
            id, 
            quantity, 
            is_purchased,
            memo,
            ingredients (
              id, 
              name, 
              unit,
              ingredient_categories (
                id,
                name,
                background_color,
                text_color
              )
            )
            `
          );
        if (error) throw error;

        this.purchases.push(...data.map(this.mapRow));
        showMessage('買い物リストに追加されました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('買い物リストの追加に失敗しました。', 'error');
        return null;
      }
    },
    async editPurchase(editItem: any) {
      try {
        const purchaseId = editItem.id;
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update({
            ingredient_id: editItem.ingredientId,
            quantity: editItem.quantity,
            memo: editItem.memo
          })
          .eq('id', purchaseId)
          .select(
            `
            id, 
            quantity, 
            is_purchased,
            memo,
            ingredients (
              id, 
              name, 
              unit,
              ingredient_categories (
                id,
                name,
                background_color,
                text_color
              )
            )
            `
          )
          .single();

        if (error) throw error;

        // ローカルキャッシュを更新
        const updateBalance = this.getById(purchaseId);

        Object.assign(updateBalance, this.mapRow(data));

        showMessage('材料が更新されました。', 'success');
        return editItem;
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('材料の更新に失敗しました。', 'error');
        return null;
      }
    },
    async changeIsPurchased(id: any, isPurchased: boolean) {
      try {
        const { error } = await supabase
          .from(TABLE_NAME)
          .update({ is_purchased: isPurchased })
          .eq('id', id);

        if (error) throw error;

        // ローカルキャッシュを更新
        const updatePurchase = this.getById(id);

        console.log(updatePurchase, id);

        Object.assign(updatePurchase, { isPurchased: isPurchased });

        showMessage('材料が更新されました。', 'success');
        // return null;
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('材料の更新に失敗しました。', 'error');
        return null;
      }
    },
    async deletePurchase(purchaseId: string) {
      try {
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', purchaseId);
        if (error) throw error;

        const indexToDelete = this.purchases.findIndex((item: any) => item.id === purchaseId);
        if (indexToDelete !== -1) {
          this.purchases.splice(indexToDelete, 1);
        }
        showMessage('材料が削除されました。', 'success');
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('材料の削除に失敗しました。', 'error');
      }
      // axios
      //   .delete(`/purchases/${purchaseId}`)
      //   .then((response: any) => {
      //     const indexToDelete = this.purchases.findIndex((item: any) => item.id === purchaseId);

      //     if (indexToDelete !== -1) {
      //       this.purchases.splice(indexToDelete, 1);
      //     }

      //     showMessage('買い物リストが削除されました。', 'success');
      //   })
      //   .catch((error: any) => {
      //     console.error('Error:', error);
      //     showMessage('買い物リストの削除に失敗しました。', 'error');
      //   });
    },
    mapRow(row: any) {
      return {
        id: row.id,
        quantity: row.quantity,
        isPurchased: row.is_purchased,
        memo: row.memo,
        ingredientId: row.ingredients.id,
        ingredientName: row.ingredients.name,
        ingredientUnit: row.ingredients.unit,
        ingredientCategoryId: row.ingredients.ingredient_categories.id,
        ingredientCategoryName: row.ingredients.ingredient_categories.name,
        ingredientCategorBackgroundColor: row.ingredients.ingredient_categories.background_color,
        ingredientCategorTextColor: row.ingredients.ingredient_categories.text_color
      };
    }
  }
});
