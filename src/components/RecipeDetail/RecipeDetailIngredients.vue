<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { useIngredientsStore } from '@/stores/ingredients';
import { Plus, Close, Edit } from '@element-plus/icons-vue';

import loadingUtils from '../../CustomLoading';

interface Props {
  recipeId: number;
}

interface Ingredient {
  ingredients: Array<any>;
}

const props = defineProps<Props>();
const recipesStore = useRecipesStore();
const ingredientsStore = useIngredientsStore();

const isDialogVisible = ref(false);

const form = reactive<Ingredient>({
  ingredients: []
});

// let servingSizeForm = ref<any>(2);

// ========================================
// Computed
// ========================================
const recipe = computed(() => {
  const r = recipesStore.getById(props.recipeId);
  r?.ingredients;
  return r;
});

// グループ化処理
const groupedOptions = computed<any[]>(() =>
  Object.values(
    ingredientsStore.ingredients.reduce(
      (acc: any, cur: any) => {
        const categoryId = cur.categoryId;
        if (!acc[categoryId]) {
          acc[categoryId] = {
            label: cur.categoryName ?? '未分類',
            options: []
          };
        }

        acc[categoryId].options.push({
          value: cur.id,
          label: cur.name
        });

        return acc;
      },
      {} as Record<number, { label: string; options: { value: number; label: string }[] }>
    )
  )
);

// ========================================
// Methods
// ========================================
onMounted(() => {
  init();
});

function init() {
  if (!recipe.value) return;
  
  form.ingredients.splice(
    0,
    form.ingredients.length, // 現在の要素を全削除
    ...recipe.value.ingredients.map((i: any) => reactive({ ...i })) // 元の値をコピーして追加
  );
}

// function getIngredients() {
//   ingredientsStore.fetchIngredients();
// }

function openDialog() {
  isDialogVisible.value = true;

  form.ingredients.splice(
    0,
    form.ingredients.length, // 現在の要素を全削除
    ...recipe.value.ingredients.map((i: any) => reactive({ ...i })) // 元の値をコピーして追加
  );
}

function addRow() {
  form.ingredients.push({ id: null, name: '', quantity: null, unit: '' });
}

function deleteRow(key: number) {
  form.ingredients.splice(key, 1);
}

async function saveIngredients() {
  loadingUtils.startLoading();

  form.ingredients = form.ingredients.filter((item: any) => item.id !== '' && item.id != null);

  await recipesStore.editRecipeIngredients(recipe.value.id, { ...form });

  isDialogVisible.value = false;
  loadingUtils.closeLoading();
}
</script>

<template>
  <div v-if="recipe" class="container">
    <div class="header-with-edit">
      <el-text tag="p" class="sub-title">材料（{{ recipe.servingSize || 2 }}人分）</el-text>
      <el-button class="main-button" color="#ff8e3c" size="small" :icon="Edit" @click="openDialog">編集</el-button>
    </div>
    <el-row>
      <el-col :span="24">
        <el-table :data="recipe.ingredients" style="width: 100%">
          <el-table-column prop="name" label="材料・調味料" />
          <el-table-column prop="quantity" label="分量">
            <template #default="scope">
              <el-space>
                <el-text tag="span"> {{ scope.row.quantity }}</el-text>
                <el-text tag="span"> {{ scope.row.unit }}</el-text>
              </el-space>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </div>

  <!-- =========================dialog========================= -->
  <el-dialog v-model="isDialogVisible" class="responsive-dialog" title="材料" align-center>
    <el-row style="margin-top: 30px">
      <el-col :span="14">
        <el-text tag="p" size="large">材料・調味料</el-text>
      </el-col>
      <el-col :span="10">
        <el-text tag="p" size="large">分量</el-text>
      </el-col>
    </el-row>

    <el-row v-for="(ingredient, index) in form.ingredients" :key="ingredient.id ?? index">
      <!-- 材料 -->
      <el-col :span="12">
        <el-select v-model="ingredient.id" placeholder="材料を選択" filterable>
          <el-option-group v-for="group in groupedOptions" :key="group.label" :label="group.label">
            <el-option
              v-for="item in group.options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-option-group>
        </el-select>
      </el-col>

      <!-- 分量 -->
      <el-col :span="8" :offset="1">
        <el-input v-model="ingredient.quantity" placeholder="分量を入力" />
      </el-col>
      <el-col :span="3">
        <el-button @click="deleteRow(index)" :icon="Close" text></el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-button @click="addRow" :icon="Plus" type="primary" text>食材を追加</el-button>
      </el-col>
    </el-row>
    <el-row style="margin-top: 30px" justify="center">
      <el-col :span="9" :offset="1">
        <el-button class="main-button" color="#ff8e3c" @click="saveIngredients">更新</el-button>
      </el-col>
      <el-col :span="6">
        <el-button type="info" @click="isDialogVisible = false">中止</el-button>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<style scoped>
.el-row {
  margin-bottom: 10px;
}
.el-row:last-child {
  margin-bottom: 0;
}

/* .el-dialog__body {
  padding: 0px !important;
} */

.header-with-edit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.sub-title {
  font-weight: bold;
  font-size: 1.2rem !important;
  margin-bottom: 0 !important;
}
</style>
