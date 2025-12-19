<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { Timer, Link, Edit, User, Document } from '@element-plus/icons-vue';
import loadingUtils from '../../CustomLoading';

interface Props {
  recipeId: number;
}

const props = defineProps<Props>();
const recipesStore = useRecipesStore();

const isDialogVisible = ref(false);

const url = '/images/no_image.png';

const typeOptions = [
  { value: '主菜', label: '主菜', type: 'danger' },
  { value: '副菜', label: '副菜', type: 'success' },
  { value: '汁物', label: '汁物', type: 'warning' }
];

const genreOptions = [
  { value: '肉料理', label: '肉料理' },
  { value: '魚料理', label: '魚料理' },
  { value: '卵料理', label: '卵料理' },
  { value: '丼もの', label: '丼もの' },
  { value: '麺類', label: '麺類' },
  { value: 'サラダ', label: 'サラダ' },
  { value: '和え物', label: '和え物' },
  { value: '煮物', label: '煮物' },
  { value: '揚げ物', label: '揚げ物' },
  { value: '味噌汁', label: '味噌汁' },
  { value: 'スープ', label: 'スープ' },
  { value: 'お菓子', label: 'お菓子' }
];

const form = reactive({
  name: '',
  description: '',
  type: '',
  genre: '',
  referenceUrl: '',
  cookingTime: 0,
  servingSize: 2,
  rating: 0,
  imageUrl: ''
});

// ========================================
// Computed
// ========================================

const tagType: any = {
  主菜: 'danger',
  副菜: 'success',
  汁物: 'warning'
};

const recipe = computed((): any => {
  return recipesStore.getById(props.recipeId);
});

const recipeType = computed((): any => {
  return tagType[recipe.value?.type] || '';
});

// ========================================
// Methods
// ========================================

function openEditDialog() {
  const r = recipe.value;
  if (!r) return;

  Object.assign(form, {
    name: r.name,
    description: r.description || '',
    type: r.type,
    genre: r.genre,
    referenceUrl: r.referenceUrl || '',
    cookingTime: r.cookingTime || 0,
    servingSize: r.servingSize || 2,
    rating: r.rating || 0,
    imageUrl: r.imageUrl || ''
  });
  isDialogVisible.value = true;
}

async function handleImageChange(uploadFile: any) {
  loadingUtils.startLoading();
  const url = await recipesStore.uploadImage(uploadFile.raw);
  if (url) {
    form.imageUrl = url;
  }
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

async function saveInfo() {
  loadingUtils.startLoading();
  await recipesStore.editRecipe({ id: props.recipeId, ...form, ingredients: recipe.value.ingredients });
  isDialogVisible.value = false;
  loadingUtils.closeLoading();
}
</script>

<template>
  <div v-if="recipe" class="container">
    <div class="header-with-edit">
      <el-text tag="p" class="title">{{ recipe.name }}</el-text>
      <el-button class="main-button" color="#ff8e3c" size="small" :icon="Edit" @click="openEditDialog">
        編集
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="10">
        <div class="image-wrapper">
          <el-image :src="recipe.imageUrl || url" fit="cover" class="recipe-image">
            <template #error>
              <el-image :src="url" fit="cover" class="recipe-image" />
            </template>
          </el-image>
        </div>
      </el-col>
      <el-col :xs="24" :sm="14">
        <div class="info-content">
          <div class="tags-row">
            <el-tag :type="recipeType">{{ recipe.type }}</el-tag>
            <el-tag type="info" plain>{{ recipe.genre }}</el-tag>
          </div>

          <div class="meta-row">
            <div class="meta-item">
              <el-icon><Timer /></el-icon>
              <span>{{ recipe.cookingTime || '--' }}分</span>
            </div>
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ recipe.servingSize || 2 }}人分</span>
            </div>
            <div class="meta-item">
              <el-rate v-model="recipe.rating" disabled />
            </div>
          </div>

          <div v-if="recipe.description" class="description-box">
            <el-icon><Document /></el-icon>
            <p>{{ recipe.description }}</p>
          </div>

          <div v-if="recipe.referenceUrl" class="link-section">
            <el-text tag="p" size="small">出典・参考リンク</el-text>
            <el-link :href="recipe.referenceUrl" type="primary" :icon="Link" target="_blank" class="truncate">
              {{ recipe.referenceUrl }}
            </el-link>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 基本情報編集ダイアログ -->
    <el-dialog v-model="isDialogVisible" title="基本情報を編集" width="90%" class="responsive-dialog" @paste="handlePaste">
      <el-form :model="form" label-width="100px">
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
        <el-form-item label="レシピ名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="タイプ">
          <el-select v-model="form.type" placeholder="選択してください">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="ジャンル">
          <el-select v-model="form.genre" placeholder="選択してください">
            <el-option v-for="item in genreOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="調理時間(分)">
          <el-input-number v-model="form.cookingTime" :min="0" />
        </el-form-item>
        <el-form-item label="人前">
          <el-input-number v-model="form.servingSize" :min="1" />
        </el-form-item>
        <el-form-item label="お気に入り度">
          <el-rate v-model="form.rating" />
        </el-form-item>
        <el-form-item label="出典URL">
          <el-input v-model="form.referenceUrl" />
        </el-form-item>
        <el-form-item label="紹介文">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isDialogVisible = false">キャンセル</el-button>
        <el-button type="primary" color="#ff8e3c" class="main-button" @click="saveInfo">保存</el-button>
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
.title {
  font-size: 1.8rem !important;
  font-weight: bold;
  margin-bottom: 0 !important;
}
.image-wrapper {
  margin-bottom: 20px;
}
.recipe-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 3rem;
}
.info-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.tags-row {
  display: flex;
  gap: 8px;
}
.meta-row {
  display: flex;
  gap: 20px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  color: #606266;
}
.description-box {
  background: #fdf6ec;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #e6a23c;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.description-box p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #303133;
}
.link-section {
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
}
.truncate {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Uploader */
.avatar-uploader .avatar {
  width: 150px;
  height: 150px;
  display: block;
  object-fit: cover;
  border-radius: 8px;
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
  width: 150px;
  height: 150px;
  text-align: center;
}
</style>
