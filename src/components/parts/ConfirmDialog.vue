<script setup lang="ts">
import { computed } from 'vue';
interface Props {
  isDialogVisible: boolean;
  message: string;
  confirmedButtonName: string;
}

interface Emits {
  (event: 'clickConfirmed'): void;
  (event: 'clickCanceled'): void;
}

// const props = defineProps<Props>();
const props = withDefaults(defineProps<Props>(), {
  confirmedButtonName: '削除' // ← デフォルト値をここで設定
});

const emit = defineEmits<Emits>();

const isDialogVisible = computed((): boolean => {
  return props.isDialogVisible;
});

const onConfirmedButtonClick = (): void => {
  emit('clickConfirmed');
};

const onCancelButtonClick = (): void => {
  emit('clickCanceled');
};
</script>

<template>
  <el-dialog
    v-model="isDialogVisible"
    title="Warning"
    class="responsive-dialog"
    align-center
    :before-close="onCancelButtonClick"
  >
    <span>{{ props.message }}</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="info" @click="onCancelButtonClick">中止</el-button>
        <el-button class="main-button" color="#ff8e3c" @click="onConfirmedButtonClick">
          {{ props.confirmedButtonName }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped></style>
