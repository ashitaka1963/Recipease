<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

import { Delete, Edit } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

import { useIngredientsStore } from '@/stores/ingredients';
import { useIngredientCategoriesStore } from '@/stores/ingredientCategories';

import PageHeader from '../components/parts/PageHeader.vue';
import ConfirmDialog from '../components/parts/ConfirmDialog.vue';
import loadingUtils from '../CustomLoading';

const ingredientsStore = useIngredientsStore();
const ingredientCategoriesStore = useIngredientCategoriesStore();

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
      trigger: 'change'
    }
  ]
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

const ingredients = computed(() => {
  return [...ingredientsStore.ingredients].sort((a, b) => a.categoryId - b.categoryId);
});

const ingredientCategories = computed(() => {
  return [...ingredientCategoriesStore.ingredientCategories].sort((a, b) => a.id - b.id);
});

// ========================================
// Methods
// ========================================
async function init() {
  loadingUtils.startLoading();

  await getIngredientCategoriesStore();
  await getIngredients();

  loadingUtils.closeLoading();
}

function getIngredients() {
  ingredientsStore.fetchIngredients();
}

function getIngredientCategoriesStore() {
  ingredientCategoriesStore.fetchIngredientCategories();
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
    const newIngredient = await ingredientsStore.addIngredient({ ...form });
    // 新規登録時に追加しておいた別名を保存
    if (newIngredient && localAliases.value.length > 0) {
      for (const alias of localAliases.value) {
        await ingredientsStore.addAlias(newIngredient.id, alias.name);
      }
    }
  }

  cancelForm();
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
  localAliases.value = [];
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

const newAliasName = ref('');
const localAliases = ref<any[]>([]);

async function addAlias() {
  if (!newAliasName.value) return;
  if (isEdit.value && form.id) {
    await ingredientsStore.addAlias(form.id, newAliasName.value);
  } else {
    // 新規登録時はローカルリストに追加
    localAliases.value.push({ id: Date.now().toString(), name: newAliasName.value });
  }
  newAliasName.value = '';
}

async function removeAlias(aliasId: string) {
  if (isEdit.value && form.id) {
    await ingredientsStore.deleteAlias(form.id, aliasId);
  } else {
    localAliases.value = localAliases.value.filter(a => a.id !== aliasId);
  }
}
</script>

<template>
  <main>
    <PageHeader headerName="食材" />
    <div class="container">
      <el-row>
        <el-col :span="24">
          <el-table :data="ingredients" style="width: 100%">
             <el-table-column prop="name" label="名前">
              <template #default="scope">
                <div class="name-cell">
                  <span>{{ scope.row.name }}</span>
                  <div class="alias-tags" v-if="scope.row.aliases?.length">
                    <el-tag v-for="alias in scope.row.aliases" :key="alias.id" size="small" type="info" class="alias-tag">
                      {{ alias.name }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="category" label="カテゴリ">
              <template #default="scope">
                <el-tag
                  :style="{
                    backgroundColor: scope.row.backgroundColor,
                    color: scope.row.textColor,
                    borderColor: scope.row.textColor
                  }"
                  >{{ scope.row.categoryName }}</el-tag
                >
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
              v-for="item in ingredientCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <template v-if="form.categoryId !== '7'">
          <el-form-item label="単位" prop="unit">
            <el-input v-model="form.unit" />
          </el-form-item>
        </template>

        <!-- 別名管理セクション -->
        <el-divider content-position="left">別名の管理（検索キーワード）</el-divider>
        <div class="alias-manager">
          <div class="alias-input">
            <el-input v-model="newAliasName" placeholder="新しい別名を入力" @keyup.enter="addAlias">
              <template #append>
                <el-button @click="addAlias">追加</el-button>
              </template>
            </el-input>
          </div>
          <div class="alias-list">
            <!-- 編集時のDBデータ -->
            <template v-if="isEdit && form.id">
              <el-tag
                v-for="alias in ingredientsStore.getById(form.id)?.aliases || []"
                :key="alias.id"
                closable
                @close="removeAlias(alias.id)"
                class="alias-item"
              >
                {{ alias.name }}
              </el-tag>
            </template>
            <!-- 新規登録時のローカルデータ -->
            <template v-else>
              <el-tag
                v-for="alias in localAliases"
                :key="alias.id"
                closable
                @close="removeAlias(alias.id)"
                class="alias-item"
              >
                {{ alias.name }}
              </el-tag>
            </template>
          </div>
        </div>
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

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alias-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.alias-tag {
  opacity: 0.8;
}

.alias-manager {
  padding: 10px;
}

.alias-input {
  margin-bottom: 12px;
}

.alias-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alias-item {
  margin-bottom: 4px;
}
</style>
