<script setup lang="ts">
import { ref } from 'vue';
import { useIngredientsStore } from '@/stores/ingredients';
import { useRecipesStore } from '@/stores/recipes';
import { CsvService } from '@/services/CsvService';
import { RecipeImportService, type ImportedRecipe } from '@/services/RecipeImportService';
import { Download, Upload, CircleCheck, Link, MagicStick } from '@element-plus/icons-vue';
import PageHeader from '../components/parts/PageHeader.vue';
import loadingUtils from '../CustomLoading';

const ingredientsStore = useIngredientsStore();
const recipesStore = useRecipesStore();

const activeTab = ref('ingredients');

// ========================================
// Ingredients CSV Logic
// ========================================
const ingredientPreview = ref<any[]>([]);
const ingredientFileRef = ref<HTMLInputElement | null>(null);

function handleIngredientExport() {
  const data = ingredientsStore.ingredients.map((ing: any) => ({
    name: ing.name,
    category: ing.categoryName,
    unit: ing.unit,
    aliases: ing.aliases?.map((a: any) => a.name).join('|') || ''
  }));

  const headers = [
    { key: 'name', label: '材料名' },
    { key: 'category', label: 'カテゴリー' },
    { key: 'unit', label: '単位' },
    { key: 'aliases', label: '別名リスト' }
  ];

  const csvContent = CsvService.jsonToCsv(data, headers);
  CsvService.downloadCsv('ingredients_backup.csv', csvContent);
}

function triggerIngredientImport() {
  ingredientFileRef.value?.click();
}

function onIngredientFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    const headerMap = {
      '材料名': 'name',
      'カテゴリー': 'category',
      '単位': 'unit',
      '別名リスト': 'aliases'
    };
    ingredientPreview.value = CsvService.csvToJson(content, headerMap);
    target.value = '';
  };
  reader.readAsText(file);
}

async function doIngredientImport() {
  if (ingredientPreview.value.length === 0) return;
  await ingredientsStore.importIngredients(ingredientPreview.value);
  ingredientPreview.value = [];
}

// ========================================
// Recipes CSV Logic
// ========================================
const recipePreview = ref<any[]>([]);
const recipeFileRef = ref<HTMLInputElement | null>(null);

function handleRecipeExport() {
  const data = recipesStore.recipes.map((r: any) => ({
    name: r.name,
    type: r.type,
    genre: r.genre,
    cookingTime: r.cookingTime,
    servingSize: r.servingSize,
    rating: r.rating,
    referenceUrl: r.referenceUrl,
    description: r.description,
    ingredients: r.ingredients.map((i: any) => `${i.name}:${i.quantity}`).join('|'),
    steps: r.steps.map((s: any) => s.description).join('|')
  }));

  const headers = [
    { key: 'name', label: 'レシピ名' },
    { key: 'type', label: 'タイプ' },
    { key: 'genre', label: 'ジャンル' },
    { key: 'cookingTime', label: '調理時間' },
    { key: 'servingSize', label: '人前' },
    { key: 'rating', label: 'お気に入り度' },
    { key: 'referenceUrl', label: '出典URL' },
    { key: 'description', label: '紹介文' },
    { key: 'ingredients', label: '材料リスト' },
    { key: 'steps', label: '手順リスト' }
  ];

  const csvContent = CsvService.jsonToCsv(data, headers);
  CsvService.downloadCsv('recipes_backup.csv', csvContent);
}

function triggerRecipeImport() {
  recipeFileRef.value?.click();
}

function onRecipeFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    const headerMap = {
      'レシピ名': 'name',
      'タイプ': 'type',
      'ジャンル': 'genre',
      '調理時間': 'cookingTime',
      '人前': 'servingSize',
      'お気に入り度': 'rating',
      '出典URL': 'referenceUrl',
      '紹介文': 'description',
      '材料リスト': 'ingredients',
      '手順リスト': 'steps'
    };
    recipePreview.value = CsvService.csvToJson(content, headerMap);
    target.value = '';
  };
  reader.readAsText(file);
}

async function doRecipeImport() {
  if (recipePreview.value.length === 0) return;
  await recipesStore.importRecipes(recipePreview.value);
  recipePreview.value = [];
}

// ========================================
// Web Import Logic
// ========================================
const importUrl = ref('');
const webImportPreview = ref<ImportedRecipe | null>(null);
const isImporting = ref(false);

async function handleWebImport() {
  if (!importUrl.value) return;
  
  isImporting.value = true;
  const data = await RecipeImportService.fetchFromUrl(importUrl.value);
  if (data) {
    webImportPreview.value = data;
  } else {
    // カスタムメッセージ等で通知
  }
  isImporting.value = false;
}

async function doWebImport() {
  if (!webImportPreview.value) return;
  
  loadingUtils.startLoading();
  const success = await recipesStore.importSingleRecipe(webImportPreview.value);
  if (success) {
    webImportPreview.value = null;
    importUrl.value = '';
  }
  loadingUtils.closeLoading();
}
</script>

<template>
  <main>
    <PageHeader headerName="データ管理" />
    <div class="container">
      <el-alert
        title="データのバックアップと一括登録"
        type="info"
        description="CSV形式でデータの書き出しと読み込みが可能です。インポート時はプレビューを確認してから実行してください。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-tabs v-model="activeTab" type="border-card">
        <!-- 材料タブ -->
        <el-tab-pane label="材料データ" name="ingredients">
          <div class="action-section">
            <el-button type="primary" :icon="Download" @click="handleIngredientExport">
              材料データをエクスポート (CSV)
            </el-button>
            <el-button type="success" :icon="Upload" @click="triggerIngredientImport">
              CSVファイルを読み込む
            </el-button>
            <input
              type="file"
              ref="ingredientFileRef"
              style="display: none"
              accept=".csv"
              @change="onIngredientFileChange"
            />
          </div>

          <div v-if="ingredientPreview.length > 0" class="preview-section">
            <div class="preview-header">
              <h3>材料インポートプレビュー ({{ ingredientPreview.length }}件)</h3>
              <el-button type="danger" :icon="CircleCheck" @click="doIngredientImport">
                この内容でインポートを実行
              </el-button>
            </div>
            <el-table :data="ingredientPreview" border stripe style="width: 100%" height="400">
              <el-table-column prop="name" label="材料名" />
              <el-table-column prop="category" label="カテゴリー" />
              <el-table-column prop="unit" label="単位" />
              <el-table-column prop="aliases" label="別名リスト" />
            </el-table>
          </div>
        </el-tab-pane>

        <!-- レシピタブ -->
        <el-tab-pane label="レシピデータ" name="recipes">
          <div class="action-section">
            <el-button type="primary" :icon="Download" @click="handleRecipeExport">
              レシピデータをエクスポート (CSV)
            </el-button>
            <el-button type="success" :icon="Upload" @click="triggerRecipeImport">
              CSVファイルを読み込む
            </el-button>
            <input
              type="file"
              ref="recipeFileRef"
              style="display: none"
              accept=".csv"
              @change="onRecipeFileChange"
            />
          </div>

          <div v-if="recipePreview.length > 0" class="preview-section">
            <div class="preview-header">
              <h3>レシピインポートプレビュー ({{ recipePreview.length }}件)</h3>
              <el-button type="danger" :icon="CircleCheck" @click="doRecipeImport">
                この内容でインポートを実行
              </el-button>
            </div>
            <el-table :data="recipePreview" border stripe style="width: 100%" height="400">
              <el-table-column prop="name" label="レシピ名" width="180" />
              <el-table-column prop="type" label="タイプ" width="100" />
              <el-table-column prop="genre" label="ジャンル" width="120" />
              <el-table-column prop="ingredients" label="材料リスト" min-width="200" show-overflow-tooltip />
              <el-table-column prop="steps" label="手順" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
        </el-tab-pane>

        <!-- Webインポートタブ -->
        <el-tab-pane label="Webインポート" name="webimport">
          <div class="action-section">
            <el-input
              v-model="importUrl"
              placeholder="レシピサイトのURLを入力 (クックパッド、クラシル等)"
              :prefix-icon="Link"
              clearable
              style="flex: 1"
            />
            <el-button 
              type="primary" 
              :icon="MagicStick" 
              @click="handleWebImport"
              :loading="isImporting"
            >
              レシピ情報を取得
            </el-button>
          </div>

          <div v-if="webImportPreview" class="web-preview-card">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="recipe-title">{{ webImportPreview.name }}</span>
                  <el-button type="success" @click="doWebImport">登録する</el-button>
                </div>
              </template>
              
              <div class="recipe-content">
                <el-image 
                  v-if="webImportPreview.imageUrl"
                  :src="webImportPreview.imageUrl" 
                  fit="cover" 
                  class="recipe-img"
                />
                <div class="recipe-details">
                  <p><strong>紹介:</strong> {{ webImportPreview.description || '--' }}</p>
                  <p><strong>調理時間:</strong> {{ webImportPreview.cookingTime || '--' }}分</p>
                  
                  <div class="preview-lists">
                    <div class="preview-list-col">
                      <p><strong>材料 ({{ webImportPreview.ingredients.length }}件):</strong></p>
                      <ul class="ing-list">
                        <li v-for="(ing, idx) in webImportPreview.ingredients.slice(0, 5)" :key="idx">
                          {{ ing.name }} : {{ ing.quantity }}
                        </li>
                        <li v-if="webImportPreview.ingredients.length > 5">...他</li>
                      </ul>
                    </div>
                    <div class="preview-list-col">
                      <p><strong>手順 ({{ webImportPreview.steps.length }}件):</strong></p>
                      <ol class="step-list">
                        <li v-for="(s, idx) in webImportPreview.steps.slice(0, 3)" :key="idx">
                          {{ s }}
                        </li>
                        <li v-if="webImportPreview.steps.length > 3">...他</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </main>
</template>

<style scoped>
.action-section {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
}

.preview-section {
  margin-top: 20px;
  border-top: 2px solid #ebeef5;
  padding-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.preview-header h3 {
  margin: 0;
  color: #606266;
}

.web-preview-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recipe-title {
  font-size: 1.2rem;
  font-weight: bold;
}

.recipe-content {
  display: flex;
  gap: 20px;
}

.recipe-img {
  width: 150px;
  height: 150px;
  border-radius: 8px;
  flex-shrink: 0;
}

.recipe-details {
  flex: 1;
}

.recipe-details p {
  margin: 0 0 8px 0;
}

.preview-lists {
  display: flex;
  gap: 30px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ebeef5;
}

.preview-list-col {
  flex: 1;
}

.ing-list, .step-list {
  margin: 0;
  padding-left: 20px;
  font-size: 0.9rem;
  color: #606266;
}

.step-list li {
  margin-bottom: 4px;
}

@media (max-width: 600px) {
  .recipe-content {
    flex-direction: column;
  }
  .recipe-img {
    width: 100%;
    height: 200px;
  }
  .preview-lists {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
