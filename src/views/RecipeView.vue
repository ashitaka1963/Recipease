<script setup lang="ts">
// TODO:新規登録後、formの値が残る
// TODO:https://element-plus.org/en-US/component/upload.html#photo-wall

import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { Search, Delete, Edit, Link, ShoppingCart, Plus, Close, Grid, Menu, Star, StarFilled } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

import { useRecipesStore } from '@/stores/recipes';
import { useIngredientsStore } from '@/stores/ingredients';
import { usePurchasesStore } from '@/stores/purchases';

import PageHeader from '../components/parts/PageHeader.vue';
import ConfirmDialog from '../components/parts/ConfirmDialog.vue';
import loadingUtils from '../CustomLoading';

const router = useRouter();
const route = useRoute();
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
const viewMode = ref('grid'); // 'list' or 'grid'
const searchQuery = ref('');
const filterType = ref('');
const filterGenre = ref('');
const filterIngredient = ref<number | ''>('');
const showOnlyFavorites = ref(false);

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

const cookingTimeOptions = [
  { value: 10, label: '10分以内' },
  { value: 20, label: '20分程度' },
  { value: 30, label: '30分程度' },
  { value: 45, label: '45分程度' },
  { value: 60, label: '1時間程度' },
  { value: 90, label: '1.5時間以上' }
];



interface Recipe {
  id: string | null;
  name: String;
  type: String;
  genre: String;
  // level: String;
  referenceUrl: String;
  cookingTime: number;
  servingSize: number;
  description: string;
  rating: number;
  imageUrl: string;
  isFavorite: boolean;
  ingredients: Array<any>;
}

const form = reactive<Recipe>({
  id: null,
  name: '',
  type: typeOptions[0].value,
  genre: genreOptions[0].value,
  // level: levelOptions[0].value,
  referenceUrl: '',
  cookingTime: 0,
  servingSize: 2,
  description: '',
  rating: 0,
  imageUrl: '',
  isFavorite: false,
  ingredients: []
});

const defaultForm: Recipe = {
  id: null,
  name: '',
  type: typeOptions[0].value,
  genre: genreOptions[0].value,
  // level: levelOptions[1].value,
  referenceUrl: '',
  cookingTime: 0,
  servingSize: 2,
  description: '',
  rating: 0,
  imageUrl: '',
  isFavorite: false,
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
      trigger: 'change'
    }
  ],
  genre: [
    {
      required: true,
      message: 'カテゴリーを選択してください。',
      trigger: 'change'
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

const filteredRecipes = computed(() => {
  return recipesStore.recipes.filter((recipe:any) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesType = !filterType.value || recipe.type === filterType.value;
    const matchesGenre = !filterGenre.value || recipe.genre === filterGenre.value;
    const matchesIngredient = !filterIngredient.value || recipe.ingredients?.some((ing: any) => ing.id === filterIngredient.value);
    const matchesFavorite = !showOnlyFavorites.value || recipe.isFavorite;
    return matchesSearch && matchesType && matchesGenre && matchesIngredient && matchesFavorite;
  });
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

  // ストックからの変換チェック
  if (route.query.fromStock === 'true') {
    isDialogVisible.value = true;
    isEdit.value = false;
    form.name = route.query.title as string || '';
    form.referenceUrl = route.query.url as string || '';
  }

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

  cancelForm();
  loadingUtils.closeLoading();
}

function deleteRow(key: number) {
  form.ingredients.splice(key, 1);
}

function addIngredient() {
  form.ingredients.push({ id: '' });
}

async function handleImageChange(uploadFile: any) {
  loadingUtils.startLoading();
  const url = await recipesStore.uploadImage(uploadFile.raw);
  if (url) {
    form.imageUrl = url;
  }
  loadingUtils.closeLoading();
}

async function toggleFavorite(recipeId: number) {
  loadingUtils.startLoading();
  await recipesStore.toggleFavorite(recipeId);
  loadingUtils.closeLoading();
}

async function handlePaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        loadingUtils.startLoading();
        const url = await recipesStore.uploadImage(file);
        if (url) {
          form.imageUrl = url;
        }
        loadingUtils.closeLoading();
      }
    }
  }
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

function formatCookingTime(minutes: number) {
  const option = cookingTimeOptions.find((opt) => opt.value === minutes);
  return option ? option.label : minutes ? `${minutes}分` : '--';
}

</script>

<style scoped>
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
  border-radius: 8px;
}

.view-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  width: 140px;
}

.recipe-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

@media (max-width: 600px) {
  .recipe-card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .filter-controls {
    padding: 12px;
    gap: 8px;
  }
  
  .search-input {
    min-width: 100%;
  }
  
  .filter-select {
    flex: 1;
    min-width: 100px;
  }
  
  .recipe-card-content {
    padding: 10px;
  }
  
  .recipe-card-title {
    font-size: 1rem;
    margin-bottom: 5px;
  }
  
  .recipe-card-meta {
    margin-bottom: 8px;
  }
  
  .recipe-card-actions {
    padding-top: 8px;
  }
}

.recipe-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid #ebeef5;
  background: white;
}

.recipe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.recipe-card-image-wrapper {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  position: relative;
}

.recipe-card-image {
  width: 100%;
  height: 100%;
}

.recipe-card-tags {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 5px;
}

.recipe-card-content {
  padding: 15px;
}

.recipe-card-favorite {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  transition: transform 0.2s;
}

.recipe-card-favorite:hover {
  transform: scale(1.2);
}

.recipe-card-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recipe-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.recipe-card-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: #909399;
}

.recipe-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f2f6fc;
  padding-top: 12px;
}

.main-button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>

<template>
  <main>
    <PageHeader headerName="レシピ" />
    <div class="container">
      <div class="filter-controls">
        <el-input
          v-model="searchQuery"
          placeholder="レシピ名で検索"
          :prefix-icon="Search"
          class="search-input"
          clearable
        />
        <el-select v-model="filterType" placeholder="タイプ" clearable class="filter-select">
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="filterGenre" placeholder="ジャンル" clearable class="filter-select">
          <el-option
            v-for="item in genreOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="filterIngredient" placeholder="材料" clearable class="filter-select" filterable>
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
        
        <el-divider direction="vertical" class="hidden-xs-only" />

        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="list" value="list">
            <el-icon><Menu /></el-icon>
          </el-radio-button>
          <el-radio-button label="grid" value="grid">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
        </el-radio-group>

        <el-button
          class="main-button"
          color="#ff8e3c"
          :icon="Plus"
          @click="
            isDialogVisible = true;
            isEdit = false;
          "
        >
          追加
        </el-button>

        <el-button
          :type="showOnlyFavorites ? 'warning' : 'info'"
          :icon="showOnlyFavorites ? StarFilled : Star"
          circle
          @click="showOnlyFavorites = !showOnlyFavorites"
          :title="showOnlyFavorites ? 'すべて表示' : 'お気に入りのみ表示'"
        />
      </div>

      <el-row v-if="viewMode === 'list'">
        <el-col :span="24">
          <el-table :data="filteredRecipes" style="width: 100%">
            <el-table-column prop="name" label="レシピ名">
              <template #default="scope">
                <el-link @click="toggleFavorite(scope.row.id)" :underline="false" style="margin-right: 8px;">
                  <el-icon :color="scope.row.isFavorite ? '#ff8e3c' : '#909399'">
                    <component :is="scope.row.isFavorite ? StarFilled : Star" />
                  </el-icon>
                </el-link>

                <el-link @click="goToRecipeDetailView(scope.row.id)" :underline="false">
                  {{ scope.row.name }}
                </el-link>

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
            <el-table-column prop="name" label="材料" class-name="hidden-xs-only">
              <template #default="scope">
                {{ scope.row.ingredients.filter((i: any) => i.categoryId !== 7 && i.categoryId !== '7').map((i: any) => i.name).join(', ') }}

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
            <el-table-column prop="type" label="タイプ" width="100">
              <template #default="scope">
                <el-tag :type="selectedType(typeOptions, scope.row.type)" size="small">
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="genre" label="ジャンル" width="100" class-name="hidden-xs-only" />
            <el-table-column width="120" fixed="right">
              <template #default="scope">
                <el-button
                  class="normal-icon-button"
                  @click="goToRecipeDetailView(scope.row.id)"
                  :icon="Search"
                  circle
                  size="small"
                ></el-button>

                <el-button
                  class="main-icon-button"
                  @click="editDialogOpen(scope.row.id)"
                  :icon="Edit"
                  circle
                  size="small"
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
                  size="small"
                ></el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>

      <div v-else class="recipe-card-grid">
        <div 
          v-for="recipe in filteredRecipes" 
          :key="recipe.id" 
          class="recipe-card"
          @click="goToRecipeDetailView(recipe.id)"
        >
          <div class="recipe-card-image-wrapper">
            <el-image 
              :src="recipe.imageUrl || '/images/no_image.png'" 
              fit="cover" 
              class="recipe-card-image"
            >
              <template #error>
                <el-image src="/images/no_image.png" fit="cover" class="recipe-card-image" />
              </template>
            </el-image>
            <div class="recipe-card-tags">
              <el-tag :type="selectedType(typeOptions, recipe.type)" size="small" effect="dark">
                {{ recipe.type }}
              </el-tag>
            </div>
            <div class="recipe-card-favorite" @click.stop="toggleFavorite(recipe.id)">
               <el-icon :color="recipe.isFavorite ? '#ff8e3c' : 'white'" size="20">
                <component :is="recipe.isFavorite ? StarFilled : Star" />
              </el-icon>
            </div>
          </div>
          <div class="recipe-card-content">
            <h3 class="recipe-card-title">{{ recipe.name }}</h3>
            <div class="recipe-card-meta">
              <el-rate v-model="recipe.rating" disabled size="small" />
              <div v-if="recipe.cookingTime" class="recipe-card-time">
                <el-icon><Timer /></el-icon>
                <span>{{ formatCookingTime(recipe.cookingTime) }}</span>
              </div>
            </div>
            <div class="recipe-card-actions" @click.stop>
              <el-button
                v-if="recipe.ingredients.length > 0"
                :icon="ShoppingCart"
                circle
                size="small"
                @click="
                  isAddToShoppingListDialogVisible = true;
                  addIngredients = recipe.ingredients;
                "
              ></el-button>
              <el-button
                :icon="Edit"
                circle
                size="small"
                class="main-icon-button"
                @click="editDialogOpen(recipe.id)"
              ></el-button>
              <el-button
                :icon="Delete"
                circle
                size="small"
                class="sub-icon-button"
                @click="
                  isConfirmDialogVisible = true;
                  deleteRecipeId = recipe.id;
                  deleteRecipeName = recipe.name;
                "
              ></el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- dialog -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      class="responsive-dialog"
      align-center
      :before-close="cancelForm"
      @paste="handlePaste"
    >
      <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="80px" status-icon>
        <el-form-item label="画像" prop="imageUrl">
          <el-upload
            class="avatar-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
          >
            <img v-if="form.imageUrl" :src="form.imageUrl" class="avatar" />
            <img v-else src="/images/no_image.png" class="avatar" />
          </el-upload>
        </el-form-item>
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

        <el-form-item label="調理時間" prop="cookingTime">
          <el-select v-model="form.cookingTime" placeholder="選択してください" clearable>
            <el-option
              v-for="item in cookingTimeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="人前" prop="servingSize">
          <el-input-number v-model="form.servingSize" :min="1" />
        </el-form-item>

        <el-form-item label="紹介文" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="お気に入り度" prop="rating">
          <el-rate v-model="form.rating" />
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
