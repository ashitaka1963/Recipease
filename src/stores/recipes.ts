import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'recipes';
const RECIPE_INGREDIENTS_TABLE_NAME = 'recipe_ingredients';

export const useRecipesStore = defineStore('recipes', {
  state: () => {
    return {
      recipes: [] as any
    };
  },
  getters: {
    getById: (state) => {
      return (recipeId: string): any => {
        return state.recipes.find((item: any) => item.id === recipeId);
      };
    }
  },
  actions: {
    async fetchRecipes() {
      try {
        const { data, error } = await supabase.from(TABLE_NAME).select(`
          id, 
          name,
          description, 
          genre,
          reference_url,
          dish_type,
          recipe_ingredients  (
            id, 
            quantity,
            ingredients (
              id,
              name,
              unit
            )
          )
          `);

        if (error) throw error;

        // this.recipes = data;

        this.recipes = data.map(this.mapRow);

        console.log(this.recipes);

        // showMessage('買い物リストを取得しました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('買い物リストの取得に失敗しました。', 'error');
      }
    },

    async addRecipe(addItem: any) {
      try {
        // レシピテーブル追加
        let { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([
            {
              name: addItem.name,
              description: addItem.description,
              genre: addItem.genre,
              reference_url: addItem.referenceUrl,
              dish_type: addItem.type
            }
          ])
          .select();

        if (!data) return;
        const recipeId = data[0].id;
        addItem.id = recipeId;

        if (error) throw error;

        if (addItem.ingredients.length >= 0) {
          // レシピ材料テーブル追加
          const payload = addItem.ingredients.map((ri: any) => ({
            recipe_id: recipeId,
            ingredient_id: ri.id,
            quantity: ri.quantity
          }));

          // TODO: error handling
          await supabase.from(RECIPE_INGREDIENTS_TABLE_NAME).insert(payload).select();

          if (error) throw error;
        }

        this.recipes.push(addItem);
        // this.purchases.push(this.mapRow(data[0])); //TODO:
        showMessage('材料が登録されました。', 'success');
      } catch (error) {
        console.error('Error:', error);
        showMessage('材料の登録に失敗しました。', 'error');
        return null;
      }
    },
    async editRecipe(editItem: any) {
      // console.log(editItem);
      // const recipeId = editItem.id;

      // axios
      //   .patch(`/recipes/${recipeId}`, editItem)
      //   .then((response: any) => {
      //     const updateRecipe = this.getById(recipeId);
      //     Object.assign(updateRecipe, response.data.recipe);

      //     showMessage('レシピが更新されました。', 'success');
      //   })
      //   .catch((error: any) => {
      //     console.error('Error:', error);
      //     showMessage('レシピの更新に失敗しました。', 'error');
      //   });

      try {
        const recipeId = editItem.id;
        const { error } = await supabase
          .from(TABLE_NAME)
          .update({
            name: editItem.name,
            description: editItem.description,
            genre: editItem.genre,
            reference_url: editItem.referenceUrl,
            dish_type: editItem.type
          })
          .eq('id', recipeId);

        if (error) throw error;

        // ローカルキャッシュを更新
        const updateBalance = this.getById(recipeId);

        Object.assign(updateBalance, editItem);

        showMessage('レシピが更新されました。', 'success');
        return editItem;
      } catch (error: any) {
        console.error('Error:', error);
        showMessage('レシピの更新に失敗しました。', 'error');
        return null;
      }
    },
    async deleteRecipe(recipeId: string) {
      try {
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
    mapRow(row: any) {
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        genre: row.genre,
        referenceUrl: row.reference_url,
        type: row.dish_type,

        ingredients: row.recipe_ingredients.map((ri: any) => ({
          id: ri.id,
          quantity: ri.quantity,
          name: ri.ingredients.name,
          unit: ri.ingredients.unit
        }))
      };
    }
  }
});
