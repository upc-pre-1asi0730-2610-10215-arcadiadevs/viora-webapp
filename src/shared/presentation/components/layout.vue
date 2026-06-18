<script setup>
import { ref } from "vue";
import NavigationSidebar from "./navigation-sidebar.vue";

const sidebarCollapsed = ref(false);
</script>

<template>
  <pv-toast />
  <pv-confirm-dialog />

  <section class="app-layout">
    <navigation-sidebar v-model:collapsed="sidebarCollapsed" />

    <section class="layout-main" :class="{ 'is-sidebar-collapsed': sidebarCollapsed }">
      <main class="layout-content">
        <router-view />
      </main>
    </section>
  </section>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  background: var(--viora-bg);
}

.layout-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin-left: var(--viora-sidebar-width);
  transition: margin-left 220ms ease;
}

.layout-main.is-sidebar-collapsed {
  margin-left: var(--viora-sidebar-collapsed-width);
}

.layout-content {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 32px;
}

@media (max-width: 900px) {
  .layout-main {
    margin-left: var(--viora-sidebar-collapsed-width);
  }

  .layout-content {
    padding: 24px 18px;
  }
}
</style>
