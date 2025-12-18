import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import showMessage from '../CustomMessage';

const TABLE_NAME = 'recipes';
const RECIPE_INGREDIENTS_TABLE_NAME = 'recipe_ingredients';

const RECIPE_LIST_SELECT = `
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
              dish_type: addItem.type
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
            dish_type: editItem.type
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
    async deleteRecipe(recipeId: string) {
      try {
        // --- レシピ材料テーブルを先に削除 ---
        const { error: recipeIngredientsError } = await supabase
          .from(RECIPE_INGREDIENTS_TABLE_NAME)
          .delete()
          .eq('recipe_id', recipeId);

        if (recipeIngredientsError) throw recipeIngredientsError;

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
    mapRow(row: any) {
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        genre: row.genre,
        referenceUrl: row.reference_url,
        type: row.dish_type,

        ingredients: row.recipe_ingredients.map((ri: any) => ({
          id: ri.ingredients.id,
          quantity: ri.quantity,
          name: ri.ingredients.name,
          unit: ri.ingredients.unit
        })),
        steps: row.recipe_steps.map((ri: any) => ({
          id: ri.id,
          stepNo: ri.step_no,
          description: ri.description
        }))
      };
    }
  }
});
