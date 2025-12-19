import { createRouter, createWebHistory } from 'vue-router';
import IngredientView from '../views/IngredientView.vue';
import RecipeView from '../views/RecipeView.vue';
import RecipeDetailView from '../views/RecipeDetailView.vue';
import CalendarView from '../views/CalendarView.vue';
import CsvImportView from '../views/CsvImportView.vue';
import PurchaseView from '../views/PurchaseView.vue';
import RecipeStockView from '../views/RecipeStockView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   name: 'IngredientView',
    //   component: IngredientView
    // },
    {
      path: '/ingredient',
      name: 'IngredientView',
      component: IngredientView
    },
    {
      path: '/recipeView',
      name: 'RecipeView',
      component: RecipeView
    },
    {
      path: '/recipeDetailView/:id',
      name: 'RecipeDetailView',
      component: RecipeDetailView,
      props: (routes) => {
        return {
          id: routes.params.id
        };
      }
    },
    {
      path: '/calendarView',
      name: 'CalendarView',
      component: CalendarView
    },
    {
      path: '/csvImportView',
      name: 'CsvImportView',
      component: CsvImportView
    },
    {
      path: '/purchaseView',
      name: 'PurchaseView',
      component: PurchaseView
    },
    {
      path: '/recipeStockView',
      name: 'RecipeStockView',
      component: RecipeStockView
    },
    {
      path: '/',
      name: 'PurchaseView',
      component: PurchaseView
    }
  ]
});

export default router;
