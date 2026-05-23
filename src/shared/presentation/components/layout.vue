<script setup>
import LanguageSwitcher from "./language-switcher.vue";
import NavigationSidebar from "./navigation-sidebar.vue";
import FooterContent from "./footer-content.vue";
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const sidebarCollapsed = ref(false);

const breadcrumbs = computed(() => {
  const crumbs = [];

  if (route.meta.parent) {
    crumbs.push({
      title: route.meta.parent,
      to: route.meta.parentRoute ? { name: route.meta.parentRoute } : null
    });
  }

  crumbs.push({
    title: route.meta.title || 'option.dashboard',
    to: null
  });

  return crumbs;
});
</script>

<template>
  <pv-toast />
  <pv-confirm-dialog />

  <section class="app-layout">
    <navigation-sidebar v-model:collapsed="sidebarCollapsed" />

    <section class="layout-main">
      <header class="app-header">
        <div class="header-content">
          <div class="left-section">
            <div class="header-titles">
              <div class="brand-breadcrumb">
                <template v-for="(crumb, index) in breadcrumbs" :key="index">
                  <router-link
                      v-if="crumb.to"
                      :to="crumb.to"
                      class="view-title clickable"
                  >
                    {{ t(crumb.title) }}
                  </router-link>
                  <span
                      v-else
                      class="view-title"
                      :class="{ 'last-crumb': index === breadcrumbs.length - 1 }"
                  >
                    {{ t(crumb.title) }}
                  </span>
                  <span v-if="index < breadcrumbs.length" class="separator">/</span>
                </template>
              </div>
              <p v-if="$route.meta.description" class="header-description">
                {{ t($route.meta.description) }}
              </p>
            </div>
          </div>

          <div class="right-section">
            <language-switcher />
          </div>
        </div>
      </header>

      <main class="layout-content">
        <router-view />
      </main>

      <footer-content />
    </section>
  </section>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  background-color: #F8F4ED;
}

.layout-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: none;
  outline: none;
}

.app-header {
  height: 80px;
  background-color: transparent;
  padding: 0 32px;
  display: flex;
  align-items: center;
  border-bottom: none;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-titles {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
}

.view-title {
  font-size: 20px;
  font-weight: 500;
  color: #8C877F;
  text-decoration: none;
}

.view-title.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.view-title.clickable:hover {
  color: #2E4A3A;
  text-decoration: underline;
}

.view-title.last-crumb {
  color: #333333;
}

.separator {
  font-size: 20px;
  font-weight: 500;
  color: #333333;
}

.header-description {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #4F4F4F;
  margin: 0;
  line-height: 1.2;
}

.layout-content {
  flex: 1;
  min-width: 0;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.layout-content > * {
  width: 100%;
  max-width: 1200px;
}

@media (max-width: 900px) {
  .layout-content {
    padding: 24px 18px 24px 96px;
  }
}
</style>