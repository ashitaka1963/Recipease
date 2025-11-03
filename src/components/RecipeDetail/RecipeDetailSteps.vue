<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRecipesStore } from '@/stores/recipes';

interface Props {
  recipeId: number;
}

const props = defineProps<Props>();
const recipesStore = useRecipesStore();

const active = ref(0);

const next = () => {
  if (active.value++ >= recipe.value.steps.length) active.value = 0;
};

// ========================================
// Computed
// ========================================

const recipe = computed((): any => {
  // return recipesStore.getById('64e9ebc7f146ca49ddb94c39');
  return recipesStore.getById(props.recipeId);
});
</script>

<template>
  <div class="container">
    <el-text tag="p" class="sub-title">手順</el-text>
    <!-- <el-button style="margin-top: 12px" @click="next">Next step</el-button> -->
    <div @click="next">
      <el-steps direction="vertical" :active="active" finish-status="success">
        <template v-for="(step, index) in recipe.steps" :key="step.id">
          <el-step :title="'Step ' + (index + 1)" :description="step.description" />
        </template>
      </el-steps>
    </div>
  </div>
</template>

<style>
div.el-step__description {
  margin-bottom: 30px;
}
</style>
