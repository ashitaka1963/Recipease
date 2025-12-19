<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Delete, Link, ForkSpoon } from '@element-plus/icons-vue';
import { useRecipeStocksStore } from '@/stores/recipeStocks';
import PageHeader from '../components/parts/PageHeader.vue';
import ConfirmDialog from '../components/parts/ConfirmDialog.vue';
import loadingUtils from '../CustomLoading';

const router = useRouter();
const stockStore = useRecipeStocksStore();

const isDialogVisible = ref(false);
const isConfirmDialogVisible = ref(false);
const deleteStockId = ref('');
const deleteStockTitle = ref('');

const form = ref({
  title: '',
  url: '',
  memo: ''
});

onMounted(async () => {
  loadingUtils.startLoading();
  await stockStore.fetchStocks();
  loadingUtils.closeLoading();
});

const submitForm = async () => {
  if (!form.value.title) return;
  
  loadingUtils.startLoading();
  await stockStore.addStock(form.value.title, form.value.url, form.value.memo);
  loadingUtils.closeLoading();
  
  closeDialog();
};

const closeDialog = () => {
  isDialogVisible.value = false;
  form.value = { title: '', url: '', memo: '' };
};

const confirmDelete = (id: string, title: string) => {
  deleteStockId.value = id;
  deleteStockTitle.value = title;
  isConfirmDialogVisible.value = true;
};

const handleDelete = async () => {
  loadingUtils.startLoading();
  await stockStore.deleteStock(deleteStockId.value);
  loadingUtils.closeLoading();
  isConfirmDialogVisible.value = false;
};

const convertToRecipe = (stock: any) => {
  // レシピ画面に遷移し、パラメータとしてタイトルとURLを渡す
  // RecipeView側でこれを受け取ってダイアログを開く実装が必要
  router.push({
    name: 'RecipeView',
    query: {
      fromStock: 'true',
      title: stock.title,
      url: stock.url
    }
  });
};
</script>

<template>
  <main>
    <PageHeader headerName="レシピストック" />
    <div class="container">
      <div class="action-bar">
        <el-button class="main-button" color="#ff8e3c" :icon="Plus" @click="isDialogVisible = true">
          ストックを追加
        </el-button>
      </div>

      <el-row :gutter="20">
        <el-col v-for="stock in stockStore.stocks" :key="stock.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stock-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="stock-title">{{ stock.title }}</span>
                <el-button
                  class="delete-btn"
                  type="danger"
                  link
                  :icon="Delete"
                  @click="confirmDelete(stock.id, stock.title)"
                ></el-button>
              </div>
            </template>
            <div class="card-content">
              <p v-if="stock.memo" class="stock-memo">{{ stock.memo }}</p>
              <div class="card-actions">
                <el-button
                  v-if="stock.url"
                  type="primary"
                  link
                  :icon="Link"
                  tag="a"
                  :href="stock.url"
                  target="_blank"
                >
                  リンクを開く
                </el-button>
                <el-button
                  type="success"
                  link
                  :icon="ForkSpoon"
                  @click="convertToRecipe(stock)"
                >
                  レシピにする
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="stockStore.stocks.length === 0" description="ストックがありません" />
    </div>

    <!-- 登録ダイアログ -->
    <el-dialog v-model="isDialogVisible" title="ストックを追加" width="90%" class="responsive-dialog">
      <el-form :model="form" label-width="80px">
        <el-form-item label="タイトル">
          <el-input v-model="form.title" placeholder="YouTube動画や料理名" />
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="form.url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="メモ">
          <el-input v-model="form.memo" type="textarea" placeholder="気になったポイントなど" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">キャンセル</el-button>
        <el-button class="main-button" color="#ff8e3c" @click="submitForm">追加</el-button>
      </template>
    </el-dialog>

    <ConfirmDialog
      :isDialogVisible="isConfirmDialogVisible"
      :message="`「${deleteStockTitle}」を削除しますか？`"
      @clickConfirmed="handleDelete"
      @clickCanceled="isConfirmDialogVisible = false"
    />
  </main>
</template>

<style scoped>
.container {
  padding: 20px;
}
.action-bar {
  margin-bottom: 20px;
}
.stock-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: transform 0.2s;
}
.stock-card:hover {
  transform: translateY(-4px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stock-title {
  font-weight: bold;
  font-size: 1.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80%;
}
.stock-memo {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
</style>
