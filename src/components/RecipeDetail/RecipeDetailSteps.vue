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
  if (active.value++ > 2) active.value = 0;
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
    <el-button style="margin-top: 12px" @click="next">Next step</el-button>
    <!-- <div class="container"> -->
    <div style="height: 300px">
      <el-steps direction="vertical" :active="active" finish-status="success">
        <el-step title="Step 1" description="xxxを炒める" />
        <el-step title="Step 2" description="Some description" />
        <el-step title="Step 3" description="Some description" />
      </el-steps>
    </div>
  </div>
</template>
