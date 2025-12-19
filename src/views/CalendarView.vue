<script setup lang="ts">
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import { Check, Sunny, Moon, Edit, Close, Plus, ShoppingCart } from '@element-plus/icons-vue';
import { ref, reactive, computed } from 'vue';

import { useRecipesStore } from '@/stores/recipes';
import { useMenusStore } from '@/stores/menus';
import { usePurchasesStore } from '@/stores/purchases';

import PageHeader from '../components/parts/PageHeader.vue';
import loadingUtils from '../CustomLoading';
import showMessage from '../CustomMessage';

const router = useRouter();
const recipesStore = useRecipesStore();
const menusStore = useMenusStore();
const purchasesStore = usePurchasesStore();

const isMenuListDialogVisible = ref(false);
const isAddMenuDialogVisible = ref(false);
const isDateFixed = ref(false); // 日付選択を表示するか
const calendarValue = ref(new Date());

const form = reactive<any>({
  menuDate: dayjs().format('YYYY-MM-DD'),
  lunch: { mainId: null, subId: null, soupId: null },
  dinner: { mainId: null, subId: null, soupId: null }
});

const selectedMenu = reactive<any>({
  id: null,
  mealTime: '',
  main: {},
  sub: {},
  soup: {}
});

const newMainRecipe = reactive<any>({
  main: null,
  sub: null,
  soup: null
});
const isMainEdit = reactive<any>({
  main: false,
  sub: false,
  soup: false
});

init();

const mealTypes = [
  { label: '昼食', value: 'lunch' },
  { label: '夕食', value: 'dinner' }
];

const recipeTypes = [
  { label: '主菜', value: 'main' },
  { label: '副菜', value: 'sub' },
  { label: '汁物', value: 'soup' }
];

// ========================================
// Computed
// ========================================

// レシピオプションを事前に計算（フリーズ防止）
const groupedRecipeOptions = computed(() => {
  const optionsMap: Record<string, any[]> = {
    '主菜': [],
    '副菜': [],
    '汁物': []
  };

  const types = ['主菜', '副菜', '汁物'];
  
  for (const type of types) {
    const categorizedData: Record<string, any[]> = {};
    
    recipesStore.recipes.forEach((item: any) => {
      if (item.type !== type) return;
      const genre = item.genre || '未分類';
      if (!categorizedData[genre]) categorizedData[genre] = [];
      categorizedData[genre].push({
        id: item.id,
        label: item.name,
        name: item.name, // 追加
        value: item.id
      });
    });

    optionsMap[type] = Object.keys(categorizedData).map(genre => ({
      label: genre,
      options: categorizedData[genre]
    }));
  }

  return optionsMap;
});

// 日付ごとのメニューMap（カレンダー表示の高速化 O(1)）
const menusMap = computed(() => {
  const map = new Map();
  for (const menu of menusStore.menus) {
    const dateKey = menu.date;
    if (!map.has(dateKey)) {
      map.set(dateKey, { date: menu.date, lunch: null, dinner: null });
    }
    const entry = map.get(dateKey);
    const mainRecipe = menu.recipes.find((r: any) => r.dishType === '主菜');
    entry[menu.type] = {
      menuId: menu.id,
      mainDishName: mainRecipe ? mainRecipe.name : '主菜なし',
      recipes: menu.recipes
    };
  }
  return map;
});

// ========================================
// Methods
// ========================================
async function init() {
  loadingUtils.startLoading();
  await recipesStore.fetchRecipes();
  await menusStore.fetchMenus();
  loadingUtils.closeLoading();
}

async function addMenu() {
  if (!form.menuDate) {
    showMessage('日付を選択してください。', 'warning');
    return;
  }
  
  const hasLunch = (form.lunch.mainId || form.lunch.subId || form.lunch.soupId);
  const hasDinner = (form.dinner.mainId || form.dinner.subId || form.dinner.soupId);

  if ((hasLunch && !form.lunch.mainId) || (hasDinner && !form.dinner.mainId)) {
    showMessage('献立を登録する場合は主菜を選択してください。', 'warning');
    return;
  }

  loadingUtils.startLoading();
  await menusStore.addMenus(form);
  
  isAddMenuDialogVisible.value = false;
  Object.assign(form, {
    menuDate: dayjs().format('YYYY-MM-DD'),
    lunch: { mainId: null, subId: null, soupId: null },
    dinner: { mainId: null, subId: null, soupId: null }
  });
  loadingUtils.closeLoading();
}

function setDate(offset: number) {
  form.menuDate = dayjs().add(offset, 'day').format('YYYY-MM-DD');
}

function setRandomMenu(targetMealType?: string) {
  const recipes = recipesStore.recipes;
  if (recipes.length === 0) {
    showMessage('レシピが登録されていません。', 'warning');
    return;
  }

  const types = targetMealType ? [targetMealType] : ['lunch', 'dinner'];
  const categories = ['main', 'sub', 'soup'];

  types.forEach((type) => {
    categories.forEach((cat) => {
      const typeLabel = cat === 'main' ? '主菜' : cat === 'sub' ? '副菜' : '汁物';
      const filtered = recipes.filter((r: any) => r.type === typeLabel);
      if (filtered.length > 0) {
        const randomIndex = Math.floor(Math.random() * filtered.length);
        form[type][cat + 'Id'] = filtered[randomIndex].id;
      }
    });
  });
  
  showMessage('献立をおまかせ設定しました。', 'success');
}

async function updateMenu() {
  if (!selectedMenu.main?.id) {
    showMessage('主菜は必須です。', 'warning');
    return;
  }

  loadingUtils.startLoading();
  const success = await menusStore.updateMenu(selectedMenu.id, {
    mainId: selectedMenu.main?.id,
    subId: selectedMenu.sub?.id,
    soupId: selectedMenu.soup?.id
  });

  if (success) {
    isMenuListDialogVisible.value = false;
  }
  loadingUtils.closeLoading();
}

// 買い物リストに追加（献立全体）
async function addToShoppingList(menus: any[]) {
  const ingredientsToAdd: any[] = [];
  
  menus.forEach(menu => {
    if (!menu) return;
    menu.recipes.forEach((menuRecipe: any) => {
      const fullRecipe = recipesStore.getById(menuRecipe.id);
      if (fullRecipe && fullRecipe.ingredients) {
        fullRecipe.ingredients.forEach((ing: any) => {
          ingredientsToAdd.push({
            id: ing.id,
            quantity: ing.quantity,
            memo: `${fullRecipe.name} 分`
          });
        });
      }
    });
  });

  if (ingredientsToAdd.length === 0) {
    showMessage('追加する材料が見つかりませんでした。', 'warning');
    return;
  }

  loadingUtils.startLoading();
  await purchasesStore.addPurchases(ingredientsToAdd);
  loadingUtils.closeLoading();
}

// 特定のレシピの材料を買い物リストに追加
async function addRecipeToShoppingList(recipeId: any) {
  if (!recipeId) return;
  
  const fullRecipe = recipesStore.getById(recipeId);
  if (!fullRecipe || !fullRecipe.ingredients) {
    showMessage('追加する材料が見つかりませんでした。', 'warning');
    return;
  }

  const ingredientsToAdd = fullRecipe.ingredients.map((ing: any) => ({
    id: ing.id,
    quantity: ing.quantity,
    memo: `${fullRecipe.name} 分`
  }));

  loadingUtils.startLoading();
  await purchasesStore.addPurchases(ingredientsToAdd);
  loadingUtils.closeLoading();
}

function dialogOpen(menuId: string, mealTime: string, recipes: any[]) {
  isMenuListDialogVisible.value = true;

  const mainDish = recipes.find((r: any) => r.dishType === '主菜');
  const sideDish = recipes.find((r: any) => r.dishType === '副菜');
  const soup = recipes.find((r: any) => r.dishType === '汁物');

  Object.assign(selectedMenu, {
    id: menuId,
    mealTime: mealTime,
    main: mainDish || {},
    sub: sideDish || {},
    soup: soup || {}
  });
  
  Object.assign(isMainEdit, { main: false, sub: false, soup: false });
  Object.assign(newMainRecipe, { main: null, sub: null, soup: null });
}

function updateSelectedMenu(targetType: string) {
  const selected = newMainRecipe[targetType];
  if (!selected) return;
  
  // 選択された情報を reactive オブジェクトに正しくマッピング
  // selected は { id, label, name, ... } の形式
  selectedMenu[targetType] = { ...selected };
  isMainEdit[targetType] = false;
}

function openAddMenuDialog(date?: string) {
  isAddMenuDialogVisible.value = true;
  if (date) {
    form.menuDate = date;
    isDateFixed.value = true;
  } else {
    form.menuDate = dayjs().format('YYYY-MM-DD');
    isDateFixed.value = false;
  }
  // 献立をリセット（必要に応じて）
  Object.assign(form.lunch, { mainId: null, subId: null, soupId: null });
  Object.assign(form.dinner, { mainId: null, subId: null, soupId: null });
}

function goToRecipeDetailView(recipeId: string) {
  if (!recipeId) return;
  router.push({ name: 'RecipeDetailView', params: { id: recipeId } });
}
</script>

<template>
  <main>
    <PageHeader headerName="献立カレンダー" />

    <div class="container">
      <el-row>
        <el-col :span="24">
          <el-button class="main-button" color="#ff8e3c" @click="openAddMenuDialog()">
            予定を追加
          </el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-calendar v-model="calendarValue" class="custom-calendar">
            <template #date-cell="{ data }">
          <div class="calendar-day" @click.stop="openAddMenuDialog(data.day)">
            {{ data.day.split('-')[2] }}
          </div>

              <div v-if="menusMap.has(data.day)" class="menu-container">
                <div v-if="menusMap.get(data.day).lunch" class="menu-item lunch">
                  <el-link @click="dialogOpen(menusMap.get(data.day).lunch.menuId, 'lunch', menusMap.get(data.day).lunch.recipes)">
                    <el-icon color="#F7A410"><Sunny /></el-icon>
                    <span class="recipe-name">{{ menusMap.get(data.day).lunch.mainDishName }}</span>
                  </el-link>
                </div>
                <div v-if="menusMap.get(data.day).dinner" class="menu-item dinner">
                  <el-link @click="dialogOpen(menusMap.get(data.day).dinner.menuId, 'dinner', menusMap.get(data.day).dinner.recipes)">
                    <el-icon color="#11068B"><Moon /></el-icon>
                    <span class="recipe-name">{{ menusMap.get(data.day).dinner.mainDishName }}</span>
                  </el-link>
                </div>
              </div>
            </template>
          </el-calendar>
        </el-col>
      </el-row>
    </div>

    <!-- 献立登録ダイアログ -->
    <el-dialog v-model="isAddMenuDialogVisible" :title="isDateFixed ? dayjs(form.menuDate).format('YYYY/MM/DD') + ' の献立登録' : '献立登録'" width="400px" align-center>
      <el-form :model="form" label-width="80px">
        <el-form-item v-if="!isDateFixed" label="日付" prop="menuDate">
          <el-date-picker v-model="form.menuDate" style="width: 100%" format="YYYY/MM/DD" value-format="YYYY-MM-DD" />
          <div class="quick-date-buttons">
            <el-button size="small" @click="setDate(0)">今日</el-button>
            <el-button size="small" @click="setDate(1)">明日</el-button>
            <el-button size="small" @click="setDate(2)">明後日</el-button>
          </div>
        </el-form-item>

        <div v-for="mType in mealTypes" :key="mType.value" class="meal-section">
          <div class="meal-header">
            <h3 class="meal-title">
              <el-icon v-if="mType.value === 'lunch'" color="#F7A410"><Sunny /></el-icon>
              <el-icon v-else color="#11068B"><Moon /></el-icon>
              {{ mType.label }}
            </h3>
            <el-button type="primary" size="small" plain @click="setRandomMenu(mType.value)">
              おまかせ
            </el-button>
          </div>

          <el-form-item v-for="rType in recipeTypes" :key="rType.value" :label="rType.label" :required="rType.value === 'main'">
            <el-select v-model="form[mType.value][rType.value + 'Id']" placeholder="レシピを選択" clearable style="width: 100%">
              <el-option-group v-for="group in groupedRecipeOptions[rType.label]" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.id" :label="item.label" :value="item.id" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </div>

        <div style="text-align: right; margin-top: 20px;">
          <el-button type="info" @click="isAddMenuDialogVisible = false">キャンセル</el-button>
          <el-button class="main-button" color="#ff8e3c" @click="addMenu">登録</el-button>
        </div>
      </el-form>
    </el-dialog>

    <!-- 献立編集ダイアログ -->
    <el-dialog v-model="isMenuListDialogVisible" :title="selectedMenu.mealTime === 'lunch' ? '昼食の編集' : '夕食の編集'" width="450px" align-center>
      <div class="edit-container">
        <div v-for="rType in recipeTypes" :key="rType.value" class="edit-row">
          <div class="edit-label">{{ rType.label }}</div>
          
          <div v-if="!isMainEdit[rType.value]" class="edit-content">
            <template v-if="selectedMenu[rType.value]?.id">
              <el-link @click="goToRecipeDetailView(selectedMenu[rType.value].id)" type="primary">
                {{ selectedMenu[rType.value].name }}
              </el-link>
              <div class="edit-actions">
                <el-button :icon="ShoppingCart" size="small" circle @click="addRecipeToShoppingList(selectedMenu[rType.value].id)" title="材料を買い物リストに追加"></el-button>
                <el-button :icon="Edit" size="small" circle @click="isMainEdit[rType.value] = true"></el-button>
              </div>
            </template>
            <template v-else>
              <span class="no-recipe">未設定</span>
              <el-button :icon="Plus" size="small" circle @click="isMainEdit[rType.value] = true" style="margin-left: 10px;"></el-button>
            </template>
          </div>

          <div v-else class="edit-input-group">
            <el-select v-model="newMainRecipe[rType.value]" value-key="id" placeholder="レシピを選択" style="flex: 1">
              <el-option-group v-for="group in groupedRecipeOptions[rType.label]" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.id" :label="item.label" :value="item" />
              </el-option-group>
            </el-select>
            <el-button :icon="Check" type="success" size="small" circle @click="updateSelectedMenu(rType.value)"></el-button>
            <el-button :icon="Close" size="small" circle @click="isMainEdit[rType.value] = false"></el-button>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; display: flex; flex-direction: column; gap: 15px;">
          <el-button type="success" @click="addToShoppingList([menusStore.getById(selectedMenu.id)])" :icon="ShoppingCart" plain>
            この献立の材料を買い物リストに追加
          </el-button>
          
          <div style="display: flex; gap: 10px; justify-content: center;">
            <el-button class="main-button" color="#ff8e3c" @click="updateMenu">保存して閉じる</el-button>
            <el-button type="info" @click="isMenuListDialogVisible = false">中止</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </main>
</template>

<style scoped>
.calendar-day {
  font-weight: bold;
  margin-bottom: 5px;
}

.quick-date-buttons {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.menu-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-name {
  margin-left: 4px;
}

.meal-section {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.meal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  color: #606266;
}
.edit-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  min-height: 40px;
}
.edit-label {
  width: 60px;
  font-weight: bold;
  color: #606266;
}
.edit-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-actions {
  display: flex;
  gap: 8px;
}
.edit-input-group {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
}
.no-recipe {
  color: #909399;
  font-style: italic;
}
:deep(.el-calendar-table .el-calendar-day) {
  height: 120px;
  padding: 8px;
}
</style>
