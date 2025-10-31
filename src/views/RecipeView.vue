<script setup lang="ts">
// TODO:新規登録後、formの値が残る
// TODO:https://element-plus.org/en-US/component/upload.html#photo-wall

import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

import { Search, Delete, Edit, Link, ShoppingCart, Plus, Close } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

import { useRecipesStore } from '@/stores/recipes';
import { useIngredientsStore } from '@/stores/ingredients';
import { usePurchasesStore } from '@/stores/purchases';

import PageHeader from '../components/parts/PageHeader.vue';
import ConfirmDialog from '../components/parts/ConfirmDialog.vue';
import loadingUtils from '../CustomLoading';

const router = useRouter();
const recipesStore = useRecipesStore();
const ingredientsStore = useIngredientsStore();
const purchasesStore = usePurchasesStore();

const ruleFormRef = ref<FormInstance>();
const isDialogVisible = ref(false);
const isConfirmDialogVisible = ref(false);
const isAddToShoppingListDialogVisible = ref(false);
const deleteRecipeId = ref('');
const deleteRecipeName = ref('');
const addIngredients = ref([]);
const isEdit = ref(true);

const typeOptions = [
  {
    value: '主菜',
    label: '主菜',
    type: 'danger'
  },
  {
    value: '副菜',
    label: '副菜',
    type: 'success'
  },
  {
    value: '汁物',
    label: '汁物',
    type: 'warning'
  }
];

const genreOptions = [
  {
    value: '肉料理',
    label: '肉料理'
  },
  {
    value: '魚料理',
    label: '魚料理'
  },
  {
    value: '卵料理',
    label: '卵料理'
  },
  {
    value: '丼もの',
    label: '丼もの'
  },
  {
    value: '麺類',
    label: '麺類'
  },
  {
    value: 'サラダ',
    label: 'サラダ'
  },
  {
    value: '和え物',
    label: '和え物'
  },
  {
    value: '煮物',
    label: '煮物'
  },
  {
    value: '揚げ物',
    label: '揚げ物'
  },
  {
    value: '味噌汁',
    label: '味噌汁'
  },
  {
    value: 'スープ',
    label: 'スープ'
  },
  {
    value: 'お菓子',
    label: 'お菓子'
  }
];

const levelOptions = [
  {
    value: '低',
    label: '低',
    type: ''
  },
  {
    value: '中',
    label: '中',
    type: 'warning'
  },
  {
    value: '高',
    label: '高',
    type: 'danger'
  }
];

interface Recipe {
  id: string | null;
  name: String;
  type: String;
  genre: String;
  // level: String;
  referenceUrl: String;
  ingredients: Array<any>;
}

const form = reactive<Recipe>({
  id: null,
  name: '',
  type: typeOptions[0].value,
  genre: genreOptions[0].value,
  // level: levelOptions[0].value,
  referenceUrl: '',
  ingredients: []
});

const defaultForm: Recipe = {
  id: null,
  name: '',
  type: typeOptions[0].value,
  genre: genreOptions[0].value,
  // level: levelOptions[1].value,
  referenceUrl: '',
  ingredients: []
};

const rules = reactive<FormRules<Recipe>>({
  name: [
    { required: true, message: '食材名を入力してください。', trigger: 'blur' },
    { min: 1, max: 30, message: '15文字以内で入力してください。', trigger: 'blur' }
  ],
  type: [
    {
      required: true,
      message: 'カテゴリーを選択してください。',
      trigger: 'blur'
    }
  ],
  genre: [
    {
      required: true,
      message: 'カテゴリーを選択してください。',
      trigger: 'blur'
    }
  ]
  // level: [
  //   {
  //     required: true,
  //     message: 'カテゴリーを選択してください。',
  //     trigger: 'blur'
  //   }
  // ]
});

init();

// ========================================
// Computed
// ========================================

const dialogTitle = computed((): any => {
  return isEdit.value ? '編集' : '新規追加';
});

const dialogButtonName = computed((): any => {
  return isEdit.value ? '更新' : '追加';
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
function goToRecipeDetailView(recipeId: number) {
  router.push({ name: 'RecipeDetailView', params: { id: recipeId } });
}

async function init() {
  loadingUtils.startLoading();

  await getRecipes();
  getIngredients();

  loadingUtils.closeLoading();
}

function getRecipes() {
  recipesStore.fetchRecipes();
}

function getIngredients() {
  ingredientsStore.fetchIngredients();
}

function editDialogOpen(recipeId: number) {
  isDialogVisible.value = true;
  isEdit.value = true;

  Object.assign(form, recipesStore.getById(recipeId));
}

async function deleteRecipe(recipeId: string) {
  loadingUtils.startLoading();

  await recipesStore.deleteRecipe(recipeId);

  loadingUtils.closeLoading();
}

async function addToShoppingList(addIngredients: any) {
  loadingUtils.startLoading();

  await purchasesStore.addPurchases(addIngredients);

  loadingUtils.closeLoading();
}

async function saveRecipe() {
  loadingUtils.startLoading();
  form.ingredients = form.ingredients.filter((item) => item.id !== '' && item.id != null);

  if (isEdit.value) {
    await recipesStore.editRecipe({ ...form });
  } else {
    await recipesStore.addRecipe({ ...form });
  }
  Object.assign(form, defaultForm);
  isDialogVisible.value = false;
  loadingUtils.closeLoading();
}

function deleteRow(key: number) {
  form.ingredients.splice(key, 1);
}

function addIngredient() {
  form.ingredients.push({ id: '' });
}

async function submitForm() {
  const formEl = ruleFormRef.value;

  console.log(formEl);
  if (!formEl) return;

  await formEl.validate((valid, fields) => {
    if (valid) {
      saveRecipe();
    } else {
      console.log('error submit!', fields);
    }
  });
}

function cancelForm() {
  const formEl = ruleFormRef.value;
  if (!formEl) return;

  formEl.resetFields();

  Object.assign(form, defaultForm);
  isDialogVisible.value = false;
}

function onConfirmButtonClick() {
  deleteRecipe(deleteRecipeId.value);
  onCancelButtonClick();
}

function onCancelButtonClick() {
  isConfirmDialogVisible.value = false;
  deleteRecipeName.value = '';
  deleteRecipeId.value = '';
}

function onAddToShoppingListDialogConfirmButtonClick() {
  addToShoppingList(addIngredients.value);
  onCAddToShoppingListDialogancelButtonClick();
}

function onCAddToShoppingListDialogancelButtonClick() {
  isAddToShoppingListDialogVisible.value = false;

  addIngredients.value = [];
}

function selectedType(options: any, name: string) {
  const category = options.find((categories: any) => categories.label === name);
  return category ? category.type : '';
}
</script>

<template>
  <main>
    <PageHeader headerName="レシピ" />
    <div class="container">
      <el-row>
        <el-col :span="24">
          <el-table :data="recipesStore.recipes" style="width: 100%">
            <el-table-column prop="name" label="レシピ名">
              <template #default="scope">
                {{ scope.row.name }}

                <template v-if="scope.row.referenceUrl">
                  <el-button
                    class="sub-icon-button"
                    :icon="Link"
                    text
                    style="padding-left: 0px; padding-right: 0px"
                    tag="a"
                    target="_blank"
                    :href="scope.row.referenceUrl"
                  ></el-button>
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="材料">
              <template #default="scope">
                <!-- TODO: 調味料省く -->
                {{ scope.row.ingredients.map((i: any) => i.name).join(', ') }}

                <template v-if="scope.row.ingredients.length > 0">
                  <el-button
                    class="sub-icon-button"
                    :icon="ShoppingCart"
                    text
                    style="padding-left: 0px; padding-right: 0px"
                    @click="
                      isAddToShoppingListDialogVisible = true;
                      addIngredients = scope.row.ingredients;
                    "
                  ></el-button>
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="タイプ">
              <template #default="scope">
                <el-tag :type="selectedType(typeOptions, scope.row.type)">{{
                  scope.row.type
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="genre" label="ジャンル" />
            <el-table-column width="160">
              <template #header>
                <el-button
                  class="main-button"
                  color="#ff8e3c"
                  @click="
                    isDialogVisible = true;
                    isEdit = false;
                  "
                  >レシピを追加</el-button
                >
              </template>
              <template #default="scope">
                <el-button
                  class="normal-icon-button"
                  @click="goToRecipeDetailView(scope.row.id)"
                  :icon="Search"
                  circle
                ></el-button>

                <el-button
                  class="main-icon-button"
                  @click="editDialogOpen(scope.row.id)"
                  :icon="Edit"
                  circle
                ></el-button>
                <el-button
                  class="sub-icon-button"
                  @click="
                    isConfirmDialogVisible = true;
                    deleteRecipeId = scope.row.id;
                    deleteRecipeName = scope.row.name;
                  "
                  :icon="Delete"
                  circle
                ></el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </div>

    <!-- dialog -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      class="responsive-dialog"
      align-center
      :before-close="cancelForm"
    >
      <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="80px" status-icon>
        <el-form-item label="名前" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item label="タイプ" prop="type">
          <el-select v-model="form.type" placeholder="Select">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="ジャンル" prop="genre">
          <el-select v-model="form.genre" placeholder="Select">
            <el-option
              v-for="item in genreOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="参考URL" prop="referenceUrl">
          <el-input v-model="form.referenceUrl" />
        </el-form-item>

        <el-form-item label="材料" prop="ingredientId">
          <el-row
            v-for="(ingredient, index) in form.ingredients"
            :key="index"
            style="margin-bottom: 10px"
          >
            <!-- <el-row> -->
            <!-- 材料 -->
            <el-col :span="12">
              <el-select v-model="ingredient.id" placeholder="材料を選択" filterable>
                <el-option-group
                  v-for="group in groupedOptions"
                  :key="group.label"
                  :label="group.label"
                >
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
          <!-- </div> -->
          <el-button @click="addIngredient" :icon="Plus" type="primary" text>材料を追加</el-button>
        </el-form-item>
        <el-form-item>
          <el-button class="main-button" color="#ff8e3c" @click="submitForm">{{
            dialogButtonName
          }}</el-button>
          <el-button type="info" @click="cancelForm">中止</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <ConfirmDialog
      :isDialogVisible="isConfirmDialogVisible"
      :message="`レシピ(${deleteRecipeName})を削除しますか？`"
      @clickConfirmed="onConfirmButtonClick"
      @clickCanceled="onCancelButtonClick"
    />

    <ConfirmDialog
      :isDialogVisible="isAddToShoppingListDialogVisible"
      :message="`買い物リストに材料追加しますか？`"
      :confirmedButtonName="`追加`"
      @clickConfirmed="onAddToShoppingListDialogConfirmButtonClick"
      @clickCanceled="onCAddToShoppingListDialogancelButtonClick"
    />
  </main>
</template>
