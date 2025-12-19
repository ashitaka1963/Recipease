<script setup lang="ts">
// TODO:調味料は重複させない？

import { ref, reactive, computed } from 'vue';
import { Delete, Edit, Plus } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { usePurchasesStore } from '@/stores/purchases';
import { useIngredientsStore } from '@/stores/ingredients';
import { useIngredientCategoriesStore } from '@/stores/ingredientCategories';
import { useFrequentItemsStore } from '@/stores/frequentItems';
import { Star, Connection } from '@element-plus/icons-vue';


import PageHeader from '../components/parts/PageHeader.vue';
import ConfirmDialog from '../components/parts/ConfirmDialog.vue';
import loadingUtils from '../CustomLoading';
import showMessage from '../CustomMessage';

const purchasesStore = usePurchasesStore();
const ingredientsStore = useIngredientsStore();
const ingredientCategoriesStore = useIngredientCategoriesStore();
const frequentItemsStore = useFrequentItemsStore();
frequentItemsStore.loadItems();


const ruleFormRef = ref<FormInstance>();
const isDialogVisible = ref(false);
const isConfirmDialogVisible = ref(false);
const isFrequentDialogVisible = ref(false);
const deletePurchaseId = ref('');
const deletePurchaseName = ref('');
const isEdit = ref(true);

// Ingredient Dialog State
const isIngredientDialogVisible = ref(false);
const ingredientRuleFormRef = ref<FormInstance>();
const ingredientForm = reactive({
  name: '',
  categoryId: '',
  unit: ''
});
const defaultIngredientForm = {
  name: '',
  categoryId: '',
  unit: ''
};
const ingredientRules = reactive<FormRules>({
  name: [
    { required: true, message: '食材名を入力してください。', trigger: 'blur' },
    { min: 1, max: 15, message: '15文字以内で入力してください。', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: 'カテゴリーを選択してください。', trigger: 'change' }
  ]
});


const target = ref('nextWeek');
const purchased = ref<any>(null);
// const startDate = ref<any>(null);
// const endDate = ref<any>(null);

interface Purchase {
  id: string | null;

  ingredientId: number | string | null;

  quantity: number | null;
  isPurchased: boolean;
  memo: string;
}

const form = reactive<Purchase>({
  id: '1',
  ingredientId: null,
  quantity: null,
  isPurchased: false,
  memo: ''
});

const defaultForm: Purchase = {
  id: null,
  ingredientId: null,
  quantity: null,
  isPurchased: false,
  memo: ''
};

const rules = reactive<FormRules<Purchase>>({
  ingredientId: [
    {
      required: true,
      message: '材料を選択してください。',
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

// const selectedIntervalLabel = computed((): any => {
//   const targetOption = targetOptions.find((option) => option.value === target.value);
//   if (targetOption) {
//     return targetOption.label;
//   } else {
//     return '未定義'; // 該当するvalueが見つからなかった場合のデフォルト値
//   }
// });

const purchasedItems = computed(() =>
  purchasesStore.purchases
    .filter((i: any) => !i.isPurchased)
    .sort((a: any, b: any) => a.ingredientCategoryName.localeCompare(b.ingredientCategoryName))
);

const unpurchasedItems = computed(() =>
  purchasesStore.purchases
    .filter((i: any) => i.isPurchased)
    .sort((a: any, b: any) => a.ingredientCategoryName.localeCompare(b.ingredientCategoryName))
);

const ingredientCategories = computed(() => {
  return [...ingredientCategoriesStore.ingredientCategories].sort((a, b) => a.id - b.id);
});


const searchQuery = ref('');

const handleFilter = (query: string) => {
  searchQuery.value = query;
};

// グループ化処理
const groupedOptions = computed<any[]>(() => {
  const query = searchQuery.value.trim();
  const lowerQuery = query.toLowerCase();

  // フィルタリング（名前または別名で検索）
  const filtered = lowerQuery
    ? ingredientsStore.ingredients.filter((i: any) =>
        i.name.toLowerCase().includes(lowerQuery) ||
        (i.aliases && i.aliases.some((a: any) => a.name.toLowerCase().includes(lowerQuery)))
      )
    : ingredientsStore.ingredients;

  // カテゴリごとにグループ化
  const groupsMap = filtered.reduce(
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
  );

  const groups = Object.values(groupsMap);

  // 未登録の入力（正式名にも別名にも一致しない場合）がある場合に「新規追加」を表示
  if (query && !ingredientsStore.ingredients.some((i: any) => 
    i.name.toLowerCase() === lowerQuery || 
    (i.aliases && i.aliases.some((a: any) => a.name.toLowerCase() === lowerQuery))
  )) {
    groups.unshift({
      label: '新規作成',
      options: [
        {
          value: query,
          label: query,
          isNew: true
        }
      ]
    });
  }

  return groups;
});
// const purchaseItems = computed((): any => {
//   // return purchasesStore.purchases;

//   // "purchases" プロパティだけを結合した新しい配列と情報を持つ配列を作成
//   const combinedPurchasesWithInfo: any = [];
//   purchasesStore.purchases.forEach((item: any) => {
//     const purchases = item.purchases.map((purchase: any, purchaseIndex: number) => ({
//       ...purchase,
//       _id: item._id,
//       purchaseIndex: purchaseIndex
//     }));
//     combinedPurchasesWithInfo.push(...purchases);
//   });
//   combinedPurchasesWithInfo.sort((a: any, b: any) => {
//     {
//       let targetOption = categoryOptions.find((option) => option.value === a.category);
//       const aSortOrder = targetOption?.sortOrder;
//       targetOption = categoryOptions.find((option) => option.value === b.category);
//       const bSortOrder = targetOption?.sortOrder;
//       if (aSortOrder === bSortOrder) {
//         return a.name.localeCompare(b.name);
//       } else if (aSortOrder && bSortOrder) {
//         return aSortOrder - bSortOrder;
//       }
//     }
//   });
//   const filteredObjects = combinedPurchasesWithInfo.filter((obj: any) => obj.isPurchased === false);
//   purchased.value = combinedPurchasesWithInfo.filter((obj: any) => obj.isPurchased === true);
//   return filteredObjects;
//   // return [
//   //   { _id: '1', category: '野菜', name: 'トマト', quantity: 2, unit: '個', isPurchased: false },
//   //   { _id: '2', category: '野菜', name: 'トマト', quantity: 2, unit: '個', isPurchased: false }
//   // ];
// });

// ========================================
// Methods
// ========================================
async function init() {
  loadingUtils.startLoading();

  await getPurchases();
  getIngredients();
  getIngredientCategories();

  loadingUtils.closeLoading();
}

function getPurchases() {
  purchasesStore.fetchPurchases();
}

function getIngredients() {
  ingredientsStore.fetchIngredients();
}

function getIngredientCategories() {
  ingredientCategoriesStore.fetchIngredientCategories();

}

function editDialogOpen(purchaseId: string) {
  isDialogVisible.value = true;
  isEdit.value = true;

  const purchase = purchasesStore.getById(purchaseId);

  Object.assign(form, purchase);
}

async function deletePurchase(ingredientId: string) {
  loadingUtils.startLoading();

  await purchasesStore.deletePurchase(ingredientId);

  loadingUtils.closeLoading();
}

const moveToPurchased = (purchaseId: number, isPurchased: boolean) => {
  purchasesStore.changeIsPurchased(purchaseId, !isPurchased);
};

async function submitForm() {
  const formEl = ruleFormRef.value;

  if (!formEl) return;

  await formEl.validate((valid, fields) => {
    if (valid) {
      savePuchase();
    } else {
      console.log('error submit!', fields);
    }
  });
}

async function savePuchase() {
  loadingUtils.startLoading();

  if (isEdit.value) {
    await purchasesStore.editPurchase({ ...form });
  } else {
    await purchasesStore.addPurchase({ ...form });
  }

  cancelForm();

  loadingUtils.closeLoading();
}

function cancelForm() {
  const formEl = ruleFormRef.value;
  if (!formEl) return;
  formEl.resetFields();
  Object.assign(form, defaultForm);
  isDialogVisible.value = false;
}

function onConfirmButtonClick() {
  deletePurchase(deletePurchaseId.value);
  onCancelButtonClick();
}

function onCancelButtonClick() {
  isConfirmDialogVisible.value = false;
  deletePurchaseName.value = '';
  deletePurchaseId.value = '';
}

async function addFrequentItemsToPurchase() {
  if (frequentItemsStore.items.length === 0) {
    showMessage('「いつものリスト」が空です。', 'warning');
    return;
  }

  loadingUtils.startLoading();
  const payload = frequentItemsStore.items.map(item => ({
    id: item.ingredientId,
    quantity: item.quantity,
    memo: item.memo || '定番品'
  }));

  await purchasesStore.addPurchases(payload);
  loadingUtils.closeLoading();
}

function removeFrequentItem(index: number) {
  frequentItemsStore.removeItem(index);
}

const frequentItemForm = reactive({
  ingredientId: null,
  quantity: null,
  memo: ''
});

function addFrequentItemToList() {
  if (!frequentItemForm.ingredientId) return;
  frequentItemsStore.addItem(
    frequentItemForm.ingredientId,
    frequentItemForm.quantity,
    frequentItemForm.memo
  );
  frequentItemForm.ingredientId = null;
  frequentItemForm.quantity = null;
  frequentItemForm.memo = '';
}

// Ingredient Creation Methods
const handleIngredientChange = (val: string | number) => {
  searchQuery.value = '';
  if (typeof val === 'string') {
    // New ingredient entered
    openIngredientDialog(val);
  }
};

function openIngredientDialog(name: string) {
  ingredientForm.name = name;
  isIngredientDialogVisible.value = true;
}

async function submitIngredientForm() {
  const formEl = ingredientRuleFormRef.value;
  if (!formEl) return;

  await formEl.validate((valid) => {
    if (valid) {
      saveNewIngredient();
    }
  });
}

async function saveNewIngredient() {
  loadingUtils.startLoading();
  const newIngredient = await ingredientsStore.addIngredient({ ...ingredientForm });
  loadingUtils.closeLoading();

  if (newIngredient) {
    form.ingredientId = newIngredient.id;
    cancelIngredientForm();
  }
}

function cancelIngredientForm() {
  const formEl = ingredientRuleFormRef.value;
  if (formEl) formEl.resetFields();
  Object.assign(ingredientForm, defaultIngredientForm);
  isIngredientDialogVisible.value = false;
  
  // If cancelled without saving, reset ingredient selection if it was a string
  if (typeof form.ingredientId === 'string' && !ingredientsStore.getById(form.ingredientId)) {
     form.ingredientId = null; 
  }
}

</script>

<template>
  <main>
    <PageHeader headerName="買い物リスト" />
    <div class="container">
      <!-- 買い物リスト操作ボタン（レスポンシブ） -->
      <div class="action-bar">
        <el-button
          type="success"
          plain
          :icon="Connection"
          @click="addFrequentItemsToPurchase"
        >
          <span class="btn-text">いつもの品を一括追加</span>
        </el-button>
        <el-button
          type="info"
          plain
          :icon="Star"
          @click="isFrequentDialogVisible = true"
        >
          <span class="btn-text">定番リスト編集</span>
        </el-button>
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
      </div>

      <!-- 買い物リスト -->
      <el-row>
        <el-col :span="24">
          <el-table :data="purchasedItems" style="width: 100%">
            <el-table-column width="26">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.isPurchased"
                  @click.prevent="moveToPurchased(scope.row.id, scope.row.isPurchased)"
                ></el-checkbox>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="カテゴリ">
              <template #default="scope">
                <el-tag
                  :style="{
                    backgroundColor: scope.row.ingredientCategorBackgroundColor,
                    color: scope.row.ingredientCategorTextColor,
                    borderColor: scope.row.ingredientCategorTextColor
                  }"
                  >{{ scope.row.ingredientCategoryName }}</el-tag
                >
              </template>
            </el-table-column>
            <el-table-column prop="ingredientName" label="材料" />
            <el-table-column prop="quantity" label="分量">
              <template #default="scope">
                {{ scope.row.quantity }}
                {{ scope.row.ingredientUnit }}
              </template>
            </el-table-column>
            <el-table-column prop="memo" label="メモ" />
            <el-table-column width="100" label="操作">
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
                    deletePurchaseId = scope.row.id;
                    deletePurchaseName = scope.row.ingredientName;
                  "
                  :icon="Delete"
                  circle
                ></el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>

      <!-- 購入済みリスト -->
      <el-collapse>
        <el-collapse-item title="購入済み" name="1">
          <el-row>
            <el-col :span="24">
              <el-table :data="unpurchasedItems" style="width: 100%">
                <el-table-column width="26">
                  <template #default="scope">
                    <el-checkbox
                      v-model="scope.row.isPurchased"
                      @click.prevent="moveToPurchased(scope.row.id, scope.row.isPurchased)"
                    ></el-checkbox>
                  </template>
                </el-table-column>
                <el-table-column prop="category" label="カテゴリ">
                  <template #default="scope">
                    <el-tag
                      :style="{
                        backgroundColor: scope.row.ingredientCategorBackgroundColor,
                        color: scope.row.ingredientCategorTextColor,
                        borderColor: scope.row.ingredientCategorTextColor
                      }"
                      >{{ scope.row.ingredientCategoryName }}</el-tag
                    >
                  </template>
                </el-table-column>
                <el-table-column prop="ingredientName" label="材料" />
                <el-table-column prop="quantity" label="分量">
                  <template #default="scope">
                    {{ scope.row.quantity }}
                    {{ scope.row.ingredientUnit }}
                  </template>
                </el-table-column>
                <el-table-column prop="memo" label="メモ" />
              </el-table>
            </el-col> </el-row
        ></el-collapse-item>
      </el-collapse>
    </div>

    <!-- FAB -->
    <el-button
      class="main-button fab"
      color="#ff8e3c"
      @click="
        isDialogVisible = true;
        isEdit = false;
      "
      :icon="Plus"
      circle
    ></el-button>

    <!-- dialog -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      class="responsive-dialog"
      align-center
      :before-close="cancelForm"
    >
      <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="80px" status-icon>
        <!-- <el-form-item label="名前" prop="name">
          <el-input v-model="form.ingredientId" />
        </el-form-item> -->

        <el-form-item label="材料" prop="ingredientId">
          <el-select
            v-model="form.ingredientId"
            placeholder="材料を選択"
            filterable
            :filter-method="handleFilter"
            default-first-option
            @change="handleIngredientChange"
            @visible-change="(visible: boolean) => !visible && (searchQuery = '')"
          >
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
              >
                <div class="option-item">
                  <span>{{ item.label }}</span>
                  <el-tag v-if="item.isNew" size="small" type="danger" effect="dark" round>New</el-tag>
                </div>
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="分量" prop="quantity">
          <el-input v-model="form.quantity" />
        </el-form-item>
        <el-form-item label="メモ" prop="memo">
          <el-input v-model="form.memo" type="textarea" />
        </el-form-item>

        <el-form-item>
          <el-button class="main-button" color="#ff8e3c" @click="submitForm">{{
            dialogButtonName
          }}</el-button>
          <el-button type="info" @click="cancelForm">中止</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- Ingredient Creation Dialog -->
    <el-dialog
      v-model="isIngredientDialogVisible"
      title="新規材料追加"
      class="responsive-dialog"
      align-center
      :before-close="cancelIngredientForm"
    >
      <el-form
        ref="ingredientRuleFormRef"
        :model="ingredientForm"
        :rules="ingredientRules"
        label-width="80px"
        status-icon
      >
        <el-form-item label="名前" prop="name">
          <el-input v-model="ingredientForm.name" />
        </el-form-item>

        <el-form-item label="カテゴリ" prop="categoryId">
          <el-select
            v-model="ingredientForm.categoryId"
            placeholder="Select"
            @change="ingredientForm.unit = ''"
          >
            <el-option
              v-for="item in ingredientCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <template v-if="ingredientForm.categoryId !== '7'">
          <el-form-item label="単位" prop="unit">
            <el-input v-model="ingredientForm.unit" />
          </el-form-item>
        </template>
        <el-form-item>
          <el-button class="main-button" color="#ff8e3c" @click="submitIngredientForm"
            >追加</el-button
          >
          <el-button type="info" @click="cancelIngredientForm">中止</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>


    <ConfirmDialog
      :isDialogVisible="isConfirmDialogVisible"
      :message="`${deletePurchaseName}を削除しますか？`"
      @clickConfirmed="onConfirmButtonClick"
      @clickCanceled="onCancelButtonClick"
    />

    <!-- 定番リスト編集ダイアログ -->
    <el-dialog v-model="isFrequentDialogVisible" title="定番リスト（よく買うもの）の編集" width="500px" align-center>
      <div class="frequent-manager">
        <el-form :inline="true" :model="frequentItemForm" class="frequent-add-form">
          <el-form-item label="材料" style="margin-bottom: 10px;">
            <el-select v-model="frequentItemForm.ingredientId" placeholder="材料を選択" filterable style="width: 180px">
              <el-option-group v-for="group in groupedOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item label="数量" style="margin-bottom: 10px;">
            <el-input v-model="frequentItemForm.quantity" placeholder="1" style="width: 80px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addFrequentItemToList" :disabled="!frequentItemForm.ingredientId">追加</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="frequentItemsStore.items" style="width: 100%; margin-top: 20px;" max-height="300px">
          <el-table-column label="材料">
            <template #default="scope">
              {{ ingredientsStore.getById(scope.row.ingredientId)?.name }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column width="60">
            <template #default="scope">
              <el-button type="danger" :icon="Delete" circle size="small" @click="removeFrequentItem(scope.$index)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="isFrequentDialogVisible = false">閉じる</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped>
el-row {
  margin-bottom: 10px;
}
.el-row:last-child {
  margin-bottom: 0;
}

.el-tag.el-tag--yellow {
  --el-tag-text-color: #e6db3c;
}
.el-tag.el-tag--yellow {
  --el-tag-bg-color: #fdfbec;
  --el-tag-border-color: #faf9d8;
  --el-tag-hover-color: #e6db3c;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.fab {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 56px;
  height: 56px;
  z-index: 9999;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

@media (max-width: 600px) {
  .action-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 8px;
  }
  .action-bar .el-button {
    margin: 0 !important;
    width: 100%;
  }
  .action-bar .el-button:last-child {
    grid-column: span 2;
  }
  .btn-text {
    font-size: 12px;
  }
}

.frequent-manager {
  padding: 10px;
}

.frequent-add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>
