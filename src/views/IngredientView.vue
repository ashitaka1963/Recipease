<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

import { Delete, Edit } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

import { useIngredientsStore } from '@/stores/ingredients';

import PageHeader from '../components/parts/PageHeader.vue';
import ConfirmDialog from '../components/parts/ConfirmDialog.vue';
import loadingUtils from '../CustomLoading';

const ingredientsStore = useIngredientsStore();

const ruleFormRef = ref<FormInstance>();
const isDialogVisible = ref(false);
const isConfirmDialogVisible = ref(false);
const deleteIngredientId = ref('');
const deleteIngredientName = ref('');
const isEdit = ref(true);

interface Ingredient {
  id: string | null;
  name: string;
  categoryId: string;
  unit: string;
}

const form = reactive<Ingredient>({
  id: null,
  name: '',
  categoryId: '',
  unit: ''
});

const defaultForm: Ingredient = {
  id: null,
  name: '',
  categoryId: '',
  unit: ''
};

const rules = reactive<FormRules<Ingredient>>({
  name: [
    { required: true, message: '食材名を入力してください。', trigger: 'blur' },
    { min: 1, max: 15, message: '15文字以内で入力してください。', trigger: 'blur' }
  ],
  categoryId: [
    {
      required: true,
      message: 'カテゴリーを選択してください。',
      trigger: 'blur'
    }
  ]
});

const categoryOptions = [
  {
    id: 1,
    value: '野菜',
    label: '野菜',
    type: 'success'
  },
  {
    id: 2,
    value: '肉',
    label: '肉',
    type: 'danger'
  },
  {
    id: 3,
    value: '魚',
    label: '魚',
    type: ''
  },
  {
    id: 4,
    value: '卵・乳製品',
    label: '卵・乳製品',
    type: 'yellow'
  },
  {
    id: 5,
    value: '穀物',
    label: '穀物',
    type: 'yellow'
  },
  {
    id: 6,
    value: '果物',
    label: '果物',
    type: 'warning'
  },
  {
    id: 7,
    value: '調味料',
    label: '調味料',
    type: 'info'
  }
];

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

const ingredients = computed(() => {
  return [...ingredientsStore.ingredients].sort((a, b) => a.categoryId - b.categoryId);
});
// ========================================
// Methods
// ========================================
async function init() {
  loadingUtils.startLoading();

  await getIngredients();

  loadingUtils.closeLoading();
}

function getIngredients() {
  ingredientsStore.fetchIngredients();
}

function editDialogOpen(ingredientId: string) {
  isDialogVisible.value = true;
  isEdit.value = true;

  const ingredient = ingredientsStore.getById(ingredientId);

  Object.assign(form, ingredient);
}

async function deleteIngredient(ingredientId: string) {
  loadingUtils.startLoading();

  await ingredientsStore.deleteIngredient(ingredientId);

  loadingUtils.closeLoading();
}

async function saveIngredient() {
  loadingUtils.startLoading();

  if (isEdit.value) {
    await ingredientsStore.editIngredient({ ...form });
  } else {
    await ingredientsStore.addIngredient({ ...form });
  }
  Object.assign(form, defaultForm);
  isDialogVisible.value = false;
  loadingUtils.closeLoading();
}

async function submitForm() {
  const formEl = ruleFormRef.value;

  if (!formEl) return;

  await formEl.validate((valid, fields) => {
    if (valid) {
      saveIngredient();
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
  deleteIngredient(deleteIngredientId.value);
  onCancelButtonClick();
}

function onCancelButtonClick() {
  isConfirmDialogVisible.value = false;
  deleteIngredientName.value = '';
  deleteIngredientId.value = '';
}

function selectedType(categoryId: string) {
  const category = categoryOptions.find((categories: any) => categories.id === categoryId);
  return category ? category.type : '';
}

// function getCategoryName(categoryId: string) {
//   const category = categoryOptions.find((categories: any) => categories.id === categoryId);
//   return category ? category.label : '';
// }
</script>

<template>
  <main>
    <PageHeader headerName="食材" />
    <div class="container">
      <el-row>
        <el-col :span="24">
          <el-table :data="ingredients" style="width: 100%">
            <el-table-column prop="name" label="名前" />
            <el-table-column prop="category" label="カテゴリ">
              <template #default="scope">
                <el-tag :type="selectedType(scope.row.categoryId)">{{
                  scope.row.categoryName
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="単位" />
            <el-table-column width="130">
              <template #header>
                <el-button
                  class="main-button"
                  color="#ff8e3c"
                  @click="
                    isDialogVisible = true;
                    isEdit = false;
                  "
                  >食材を追加</el-button
                >
              </template>
              <template #default="scope">
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
                    deleteIngredientId = scope.row.id;
                    deleteIngredientName = scope.row.name;
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

        <el-form-item label="カテゴリ" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="Select" @change="form.unit = ''">
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <template v-if="form.categoryId !== '7'">
          <el-form-item label="単位" prop="unit">
            <el-input v-model="form.unit" />
          </el-form-item>
        </template>
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
      :message="`食材(${deleteIngredientName})を削除しますか？`"
      @clickConfirmed="onConfirmButtonClick"
      @clickCanceled="onCancelButtonClick"
    />
  </main>
</template>

<style scoped>
.el-tag.el-tag--yellow {
  --el-tag-text-color: #e6db3c;
}
.el-tag.el-tag--yellow {
  --el-tag-bg-color: #fdfbec;
  --el-tag-border-color: #faf9d8;
  --el-tag-hover-color: #e6db3c;
}
</style>
