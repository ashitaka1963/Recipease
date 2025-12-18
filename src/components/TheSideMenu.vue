<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

import {
  Menu as IconMenu,
  Setting,
  User,
  Apple,
  ShoppingCart,
  Calendar,
  ForkSpoon,
  UploadFilled
} from '@element-plus/icons-vue';

interface Emits {
  (event: 'menuClick'): void;
}

const router = useRouter();
const route = useRoute();

const routeMap = new Map([
  ['1', 'DashboardView'],
  ['2', 'UsersView'],
  ['3', 'IngredientView'],
  ['4', 'PurchaseView'],
  ['5', 'CalendarView'],
  ['6', 'RecipeView'],
  ['7', 'CsvImportView']
]);

// 現在のルート名からアクティブなインデックスを計算
const activeIndex = computed(() => {
  const currentName = route.name as string;
  for (const [key, value] of routeMap.entries()) {
    if (value === currentName) return key;
  }
  // レシピ詳細画面などの場合は親のインデックスを返す
  if (currentName === 'RecipeDetailView') return '6';
  return '4'; // デフォルトは買い物
});

// const emit = defineEmits(['menu-click']);
const emit = defineEmits<Emits>();

const menuClick = (key: string) => {
  emit('menuClick');
  router.push({ name: routeMap.get(key) });
};
</script>

<template>
  <div style="padding-left: 8px">
    <el-menu :default-active="activeIndex" :collapse="false" @select="menuClick" class="responsive-menu">
      <!-- <el-menu-item index="1">
      <el-icon :size="50"><icon-menu /></el-icon>
      <template #title>Dashboard</template>
    </el-menu-item> -->
      <el-menu-item index="4">
        <el-icon :size="50"><ShoppingCart /></el-icon>
        <template #title>買い物</template>
      </el-menu-item>
      <el-menu-item index="5">
        <el-icon :size="50"><Calendar /></el-icon>
        <template #title>献立</template>
      </el-menu-item>
      <el-menu-item index="6">
        <el-icon :size="50"><ForkSpoon /></el-icon>
        <template #title>レシピ</template>
      </el-menu-item>
      <el-menu-item index="3">
        <el-icon :size="50"><Apple /></el-icon>
        <template #title>材料</template>
      </el-menu-item>
      <!-- <el-menu-item index="7">
      <el-icon :size="50"><UploadFilled /></el-icon>
      <template #title>一括登録</template>
    </el-menu-item> -->

      <!-- <el-menu-item index="2">
      <el-icon :size="50"><user /></el-icon>
      <template #title>User</template>
    </el-menu-item> -->
    </el-menu>
  </div>
</template>

<style scoped>
.responsive-menu {
  border-right: none;
}
</style>
