<script setup lang="ts">
// TODO:調味料は重複させない？

import { ref, reactive, computed } from 'vue';
import { Delete, Edit } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { usePurchasesStore } from '@/stores/purchases';
import { useIngredientsStore } from '@/stores/ingredients';

import PageHeader from '../components/parts/PageHeader.vue';
import ConfirmDialog from '../components/parts/ConfirmDialog.vue';
import loadingUtils from '../CustomLoading';

const purchasesStore = usePurchasesStore();
const ingredientsStore = useIngredientsStore();

const ruleFormRef = ref<FormInstance>();
const isDialogVisible = ref(false);
const isConfirmDialogVisible = ref(false);
const deletePurchaseId = ref('');
const deletePurchaseName = ref('');
const isEdit = ref(true);

const target = ref('nextWeek');
const purchased = ref<any>(null);
// const startDate = ref<any>(null);
// const endDate = ref<any>(null);

interface Purchase {
  id: string | null;

  ingredientId: number | null;
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
  // ingredientId: [
  //   { required: true, message: '購入品を選択してください。', trigger: 'blur' }
  //   // { min: 1, max: 15, message: '15文字以内で入力してください。', trigger: 'blur' }
  // ]
  // categoryId: [
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

  loadingUtils.closeLoading();
}

function getPurchases() {
  purchasesStore.fetchPurchases();
}

function getIngredients() {
  ingredientsStore.fetchIngredients();
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

  Object.assign(form, defaultForm);
  isDialogVisible.value = false;
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
</script>

<template>
  <main>
    <PageHeader headerName="買い物リスト" />
    <div class="container">
      <!-- 買い物リスト -->
      <el-row>
        <el-col :span="24">
          <el-table :data="purchasedItems" style="width: 100%">
            <el-table-column width="55">
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
            <el-table-column width="130">
              <template #header>
                <el-button
                  class="main-button"
                  color="#ff8e3c"
                  @click="
                    isDialogVisible = true;
                    isEdit = false;
                  "
                  >リストに追加</el-button
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
              <el-table :data="unpurchasedItems" style="width: 80%">
                <el-table-column width="55">
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

        <el-form-item label="材料" prop="name">
          <el-select v-model="form.ingredientId" placeholder="材料を選択" filterable>
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
        </el-form-item>

        <el-form-item label="分量" prop="quantity">
          <el-input v-model="form.quantity" />
        </el-form-item>
        <el-form-item label="メモ" prop="memo">
          <el-input v-model="form.memo" type="textarea" />
        </el-form-item>

        <!-- 
        <template v-if="form.categoryId !== '7'">
          <el-form-item label="単位" prop="unit">
            <el-input v-model="form.unit" />
          </el-form-item>
        </template> -->
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
      :message="`${deletePurchaseName}を削除しますか？`"
      @clickConfirmed="onConfirmButtonClick"
      @clickCanceled="onCancelButtonClick"
    />
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
</style>
