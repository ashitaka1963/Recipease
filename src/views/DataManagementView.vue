<script setup lang="ts">
import { ref } from 'vue';
import { useIngredientsStore } from '@/stores/ingredients';
import { useRecipesStore } from '@/stores/recipes';
import { CsvService } from '@/services/CsvService';
import { Download, Upload, CircleCheck } from '@element-plus/icons-vue';
import PageHeader from '../components/parts/PageHeader.vue';

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
</style>
