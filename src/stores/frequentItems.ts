import { defineStore } from 'pinia';

const STORAGE_KEY = 'recipease_frequent_items';

export const useFrequentItemsStore = defineStore('frequentItems', {
  state: () => ({
    items: [] as any[]
  }),
  actions: {
    loadItems() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.items = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load frequent items', e);
          this.items = [];
        }
      }
    },
    saveItems() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    },
    addItem(ingredientId: string, quantity: number | null, memo: string) {
      this.items.push({ ingredientId, quantity, memo });
      this.saveItems();
    },
    removeItem(index: number) {
      this.items.splice(index, 1);
      this.saveItems();
    },
    updateItem(index: number, updated: any) {
      this.items[index] = { ...this.items[index], ...updated };
      this.saveItems();
    }
  }
});
