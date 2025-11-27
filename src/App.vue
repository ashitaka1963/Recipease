<script setup lang="ts">
import { RouterView } from 'vue-router';
import TheSideMenu from './components/TheSideMenu.vue';

import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Expand } from '@element-plus/icons-vue';

const drawer = ref(false);
const isMobile = ref(window.innerWidth < 600);

const handleResize = () => {
  isMobile.value = window.innerWidth < 600;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

function onMenuClick() {
  drawer.value = false;
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- <el-header>Header</el-header> -->

      <el-container>
        <el-aside v-if="!isMobile" class="side-menu" width="150px">
          <TheSideMenu @menuClick="onMenuClick"
        /></el-aside>
        <el-drawer v-else v-model="drawer" direction="ltr" :with-header="false" size="150px">
          <TheSideMenu @menuClick="onMenuClick" />
        </el-drawer>

        <el-main class="main-with-side">
          <div v-if="isMobile" class="sub-nav">
            <el-button type="primary" text :icon="Expand" @click="drawer = true"> Menu </el-button>
          </div>
          <RouterView />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  border-right: 1px solid #ebeef5;
}

@media (min-width: 600px) {
  /* スマホではないとき固定サイドメニューの幅分ずらす */
  .main-with-side {
    margin-left: 150px;
  }
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
