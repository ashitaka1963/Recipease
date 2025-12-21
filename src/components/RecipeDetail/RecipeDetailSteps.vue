<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { Edit, Plus, Delete, Top, Bottom } from '@element-plus/icons-vue';
import loadingUtils from '../../CustomLoading';

interface Props {
  recipeId: number;
}

const props = defineProps<Props>();
const recipesStore = useRecipesStore();

const isDialogVisible = ref(false);
const active = ref(0);

const form = reactive({
  steps: [] as any[]
});

// ========================================
// Computed
// ========================================

const recipe = computed((): any => {
  return recipesStore.getById(props.recipeId);
});

// ========================================
// Methods
// ========================================

const next = () => {
  if (recipe.value.steps && active.value < recipe.value.steps.length) {
    active.value++;
  } else {
    active.value = 0;
  }
};

/**
 * 手順内の材料名を抽出し、分量を付与してハイライトする
 */
function formatDescription(description: string) {
  if (!description || !recipe.value || !recipe.value.ingredients) return description;

  let formatted = description;
  
  // 材料名の長い順にソート（部分一致での誤爆を防ぐため）
  const sortedIngredients = [...recipe.value.ingredients].sort((a, b) => b.name.length - a.name.length);

  sortedIngredients.forEach((ing: any) => {
    if (!ing.name) return;
    
    // まだハイライトされていない箇所を検索して置換
    // すでに <span> で囲まれている場合は無視するようにする
    const escapedName = ing.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!<span[^>]*>)${escapedName}(?![^<]*</span>)`, 'g');
    
    const quantityStr = ing.quantity ? `<small class="ing-qty">(${ing.quantity})</small>` : '';
    formatted = formatted.replace(regex, `<span class="highlight-ing">${ing.name}${quantityStr}</span>`);
  });

  return formatted;
}

function openEditDialog() {
  form.steps = recipe.value.steps.map((s: any) => ({ ...s }));
  isDialogVisible.value = true;
}

function addStep() {
  form.steps.push({ description: '' });
}

function removeStep(index: number) {
  form.steps.splice(index, 1);
}

function moveUp(index: number) {
  if (index === 0) return;
  const temp = form.steps[index];
  form.steps[index] = form.steps[index - 1];
  form.steps[index - 1] = temp;
}

function moveDown(index: number) {
  if (index === form.steps.length - 1) return;
  const temp = form.steps[index];
  form.steps[index] = form.steps[index + 1];
  form.steps[index + 1] = temp;
}

async function saveSteps() {
  loadingUtils.startLoading();
  await recipesStore.editRecipeSteps(props.recipeId, form.steps);
  isDialogVisible.value = false;
  loadingUtils.closeLoading();
}
</script>

<template>
  <div v-if="recipe" class="container">
    <div class="header-with-edit">
      <el-text tag="p" class="sub-title">手順</el-text>
      <el-button class="main-button" color="#ff8e3c" size="small" :icon="Edit" @click="openEditDialog">編集</el-button>
    </div>

    <div v-if="recipe.steps && recipe.steps.length > 0" class="steps-wrapper" @click="next">
      <el-steps direction="vertical" :active="active" finish-status="success">
        <el-step
          v-for="(step, index) in recipe.steps"
          :key="step.id || index"
          :title="'Step ' + (Number(index) + 1)"
        >
          <template #description>
            <div class="step-desc" v-html="formatDescription(step.description)"></div>
          </template>
        </el-step>
      </el-steps>
    </div>
    <el-empty v-else description="手順が登録されていません" />

    <!-- 手順編集ダイアログ -->
    <el-dialog v-model="isDialogVisible" title="手順を編集" width="90%" class="responsive-dialog">
      <div class="edit-steps-container">
        <div v-for="(step, index) in form.steps" :key="index" class="step-edit-item">
          <div class="step-number">Step {{ index + 1 }}</div>
          <el-input
            v-model="step.description"
            type="textarea"
            :rows="2"
            placeholder="手順の説明を入力してください"
          />
          <div class="step-controls">
            <el-button-group>
              <el-button :icon="Top" size="small" :disabled="index === 0" @click="moveUp(index)"></el-button>
              <el-button :icon="Bottom" size="small" :disabled="index === form.steps.length - 1" @click="moveDown(index)"></el-button>
            </el-button-group>
            <el-button type="danger" :icon="Delete" size="small" circle @click="removeStep(index)"></el-button>
          </div>
        </div>
        <el-button type="primary" :icon="Plus" plain class="add-step-btn" @click="addStep">手順を追加</el-button>
      </div>
      <template #footer>
        <el-button @click="isDialogVisible = false">キャンセル</el-button>
        <el-button type="primary" color="#ff8e3c" class="main-button" @click="saveSteps">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header-with-edit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.sub-title {
  font-weight: bold;
  font-size: 1.2rem !important;
  margin-bottom: 0 !important;
}
.steps-wrapper {
  padding: 10px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
}
.step-desc {
  margin-bottom: 25px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #303133;
}
:deep(.highlight-ing) {
  color: #ff8e3c;
  font-weight: bold;
  background-color: #fff4ec;
  padding: 0 4px;
  border-radius: 4px;
  display: inline-block;
}
:deep(.ing-qty) {
  font-weight: normal;
  color: #606266;
  margin-left: 2px;
}
:deep(.el-step__description) {
  margin-bottom: 25px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #303133;
}
.edit-steps-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}
.step-edit-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
}
.step-number {
  font-weight: bold;
  margin-bottom: 8px;
  color: #ff8e3c;
}
.step-controls {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.add-step-btn {
  width: 100%;
  margin-top: 10px;
  border-style: dashed;
}
</style>
