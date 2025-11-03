<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

import PageHeader from '../components/parts/PageHeader.vue';
import RecipeDetailInfo from '../components/RecipeDetail/RecipeDetailInfo.vue';
import RecipeDetailIngredients from '../components/RecipeDetail/RecipeDetailIngredients.vue';
import RecipeDetailSteps from '../components/RecipeDetail/RecipeDetailSteps.vue';

interface Props {
  id: string;
}

const props = defineProps<Props>();
const recipeId = Number(props.id);

const isTop = ref(false);
</script>

<template>
  <main>
    <PageHeader headerName="レシピ詳細" :isTop="isTop" />

    <RecipeDetailInfo :recipeId="recipeId" />
    <RecipeDetailIngredients :recipeId="recipeId" />
    <RecipeDetailSteps :recipeId="recipeId" />
  </main>
</template>
