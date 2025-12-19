<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import PageHeader from '../components/parts/PageHeader.vue';
import RecipeDetailInfo from '../components/RecipeDetail/RecipeDetailInfo.vue';
import RecipeDetailIngredients from '../components/RecipeDetail/RecipeDetailIngredients.vue';
import RecipeDetailSteps from '../components/RecipeDetail/RecipeDetailSteps.vue';
import loadingUtils from '../CustomLoading';

interface Props {
  id: string;
}

const props = defineProps<Props>();
const recipesStore = useRecipesStore();
const recipeId = Number(props.id);

const isTop = ref(false);
const isLoaded = ref(false);

onMounted(async () => {
  loadingUtils.startLoading();
  if (recipesStore.recipes.length === 0) {
    await recipesStore.fetchRecipes();
  }
  isLoaded.value = true;
  loadingUtils.closeLoading();
});
</script>

<template>
  <main>
    <PageHeader headerName="レシピ詳細" :isTop="isTop" />

    <template v-if="isLoaded">
      <RecipeDetailInfo :recipeId="recipeId" />
      <RecipeDetailIngredients :recipeId="recipeId" />
      <RecipeDetailSteps :recipeId="recipeId" />
    </template>
  </main>
</template>
