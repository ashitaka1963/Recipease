import { defineStore } from 'pinia';

import { supabase } from '../lib/supabaseClient';
import axios from '../axios';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'menus';

const MENU_LIST_SELECT = `
          id, 
          date,
          type, 
          menu_recipes  (
            id, 
            recipes (
              id,
              name,
              description, 
              dish_type
            )
          )
          `;

export const useMenusStore = defineStore('menus', {
  state: () => {
    return {
      menus: [] as any
    };
  },
  getters: {
    getById: (state) => {
      return (menuId: string): any => {
        return state.menus.find((item: any) => item.id === menuId);
      };
    }
  },
  actions: {
    async fetchMenus() {
      // axios
      //   .get('/menus')
      //   .then((response: any) => {
      //     this.menus = response.data;
      //     showMessage('献立を取得しました。', 'success');
      //   })
      //   .catch((error: any) => {
      //     console.error('Error:', error);
      //     showMessage('献立の取得に失敗しました。', 'error');
      //   });

      try {
        const { data, error } = await supabase.from(TABLE_NAME).select(MENU_LIST_SELECT);
        if (error) throw error;

        this.menus = data.map(this.mapRow);

        // showMessage('レシピリストを取得しました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('レシピリストの取得に失敗しました。', 'error');
      }
    },

    async addMenu(addItem: any) {
      axios
        .post('/menus', addItem)
        .then((response: any) => {
          this.menus.push(response.data.menu);
          showMessage('献立が登録されました。', 'success');
        })
        .catch((error: any) => {
          console.error('Error:', error);
          showMessage('献立の登録に失敗しました。', 'error');
        });
    },
    async addMenus(form: any) {
      try {
        const hasLunch = form.lunch.mainId || form.lunch.subId || form.lunch.soupId;
        const hasDinner = form.dinner.mainId || form.dinner.subId || form.dinner.soupId;

        if (!hasLunch && !hasDinner) {
          return;
        }

        // 1. メニューテーブルの登録データ作成
        const menusToInsert: { date: string; type: string }[] = [];
        if (hasLunch) menusToInsert.push({ date: form.menuDate, type: 'lunch' });
        if (hasDinner) menusToInsert.push({ date: form.menuDate, type: 'dinner' });

        // 複数行insert
        const { data: insertedMenus, error: menuError } = await supabase
          .from(TABLE_NAME)
          .insert(menusToInsert)
          .select();

        if (menuError) throw menuError;
        console.log('menus登録成功:', insertedMenus);

        // 2. メニューレシピテーブルの登録データ作成
        const recipesToInsert: any[] = [];

        for (const menu of insertedMenus) {
          const type = menu.type;
          const recipes = form[type];

          const mapping = [
            { id: recipes.mainId, dishType: 'main' },
            { id: recipes.subId, dishType: 'sub' },
            { id: recipes.soupId, dishType: 'soup' }
          ];

          for (const r of mapping) {
            if (!r.id) continue; // nullはスキップ
            recipesToInsert.push({
              menu_id: menu.id,
              recipe_id: r.id
            });
          }

          if (recipesToInsert.length > 0) {
            const { error: recipeError } = await supabase
              .from('menu_recipes')
              .insert(recipesToInsert);

            if (recipeError) throw recipeError;
            console.log('menu_recipes登録成功:', recipesToInsert);
          }
        }

        // --- 再取得してstore更新 ---
        // MENU_LIST_SELECTを利用してSupabaseから再取得する
        const { data: updatedMenus, error: fetchError } = await supabase
          .from('menus')
          .select(
            `
          id,
          date,
          type,
          menu_recipes (
            id,
            recipes (
              id,
              name,
              description,
              dish_type
            )
          )
        `
          )
          .in(
            'id',
            insertedMenus.map((m) => m.id)
          );

        if (fetchError) throw fetchError;

        // 重複を避けて追加
        const mappedIndices = updatedMenus.map(m => m.id);
        this.menus = this.menus.filter((m: any) => !mappedIndices.includes(m.id));
        this.menus.push(...updatedMenus.map(this.mapRow));

        showMessage('献立が登録されました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('献立リストの登録に失敗しました。', 'error');
      }

      // axios
      //   .post('/menus', addItem)
      //   .then((response: any) => {
      //     this.menus.push(response.data.menu);
      //     showMessage('献立が登録されました。', 'success');
      //   })
      //   .catch((error: any) => {
      //     console.error('Error:', error);
      //     showMessage('献立の登録に失敗しました。', 'error');
      //   });
    },
    async updateMenu(menuId: string, recipes: { mainId: any; subId: any; soupId: any }) {
      try {
        // 1. 既存のレシピを削除
        const { error: deleteError } = await supabase
          .from('menu_recipes')
          .delete()
          .eq('menu_id', menuId);

        if (deleteError) throw deleteError;

        // 2. 新しいレシピを登録
        const recipesToInsert: any[] = [];
        if (recipes.mainId) recipesToInsert.push({ menu_id: menuId, recipe_id: recipes.mainId });
        if (recipes.subId) recipesToInsert.push({ menu_id: menuId, recipe_id: recipes.subId });
        if (recipes.soupId) recipesToInsert.push({ menu_id: menuId, recipe_id: recipes.soupId });

        if (recipesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('menu_recipes')
            .insert(recipesToInsert);
          if (insertError) throw insertError;
        }

        // 3. 再取得してstore更新
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select(MENU_LIST_SELECT)
          .eq('id', menuId)
          .single();

        if (error) throw error;

        const index = this.menus.findIndex((m: any) => m.id === menuId);
        if (index !== -1) {
          this.menus[index] = this.mapRow(data);
        }

        showMessage('献立を更新しました。', 'success');
        return true;
      } catch (error) {
        console.error('Error:', error);
        showMessage('献立の更新に失敗しました。', 'error');
        return false;
      }
    },
    async editMenu(editItem: any) {
      // 古い実装なので無視してupdateMenuを使う
      console.log('deprecated editMenu called', editItem);
    },
    async deleteMenu(menuId: string) {
      try {
        // menu_recipes は CASCADE 設定されている前提（そうでなければここで消す）
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', menuId);
        if (error) throw error;

        const indexToDelete = this.menus.findIndex((item: any) => item.id === menuId);
        if (indexToDelete !== -1) {
          this.menus.splice(indexToDelete, 1);
        }

        showMessage('献立を削除しました。', 'success');
        return true;
      } catch (error) {
        console.error('Error:', error);
        showMessage('献立の削除に失敗しました。', 'error');
        return false;
      }
    },
    mapRow(row: any) {
      return {
        id: row.id,
        date: row.date,
        type: row.type,

        recipes: row.menu_recipes.map((ri: any) => ({
          id: ri.recipes.id,
          linkId: ri.id,
          name: ri.recipes.name,
          dishType: ri.recipes.dish_type
        }))
      };
    }
  }
});
