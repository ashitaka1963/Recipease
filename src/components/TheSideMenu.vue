<script setup lang="ts">
import { useRouter } from 'vue-router';

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

const router = useRouter();

const routeMap = new Map([
  ['1', 'DashboardView'],
  ['2', 'UsersView'],
  ['3', 'IngredientView'],
  ['6', 'RecipeView'],
  ['5', 'CalendarView'],
  ['7', 'CsvImportView'],
  ['4', 'PurchaseView']
]);

const menuClick = (key: string) => {
  router.push({ name: routeMap.get(key) });
};
</script>

<template>
  <el-menu default-active="1" collapse="false" @select="menuClick">
    <!-- <el-menu-item index="1">
      <el-icon :size="50"><icon-menu /></el-icon>
      <template #title>Dashboard</template>
    </el-menu-item> -->
    <!-- <el-menu-item index="5">
      <el-icon :size="50"><Calendar /></el-icon>
      <template #title>献立</template>
    </el-menu-item> -->
    <el-menu-item index="4">
      <el-icon :size="50"><ShoppingCart /></el-icon>
      <template #title>買い物リスト</template>
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
</template>
<style>
.el-menu {
  border-right: none;
  margin: 0 auto;
}

.el-menu-item i {
  color: #3e4451;
}

/* .el-menu-item.is-active {
  color: #c7a780;
  background-color: #30343d;
} */
</style>
