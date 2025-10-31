<script setup lang="ts">
import { computed } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { Picture as IconPicture, Timer, Link } from '@element-plus/icons-vue';

interface Props {
  recipeId: number;
}

const props = defineProps<Props>();
const recipesStore = useRecipesStore();

const url = 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'; //TODO:

// ========================================
// Computed
// ========================================

const tagType: any = {
  主菜: '',
  副菜: 'success',
  汁物: 'warning'
};

const recipe = computed((): any => {
  return recipesStore.getById(props.recipeId);
});

const recipeType = computed((): any => {
  return tagType[recipe.value.type];
});
</script>

<template>
  <div class="container">
    <el-text tag="p" class="title">{{ recipe.name }}</el-text>
    <el-row>
      <el-col :span="12">
        <div>
          <el-image style="width: 300px; height: 300px" :src="url" fit="fill">
            <template #error>
              <div class="image-slot">
                <el-icon><icon-picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
      </el-col>
      <el-col :span="12">
        <el-row>
          <el-col :span="24">
            <el-tag :type="recipeType">{{ recipe.type }}</el-tag>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-tag type="info">{{ recipe.genre }}</el-tag>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-space>
              <el-icon><Timer /></el-icon>
              <!-- TODO: -->
              <el-text tag="span">10分</el-text>
            </el-space>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <!-- TODO: -->
            <el-rate size="large" />
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-text tag="p">関連リンク</el-text>
            <el-link :href="recipe.referenceUrl" type="primary" :icon="Link" target="_blank">{{
              recipe.referenceUrl
            }}</el-link>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
</style>
