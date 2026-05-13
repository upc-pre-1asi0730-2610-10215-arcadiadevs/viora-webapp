<script setup>
/**
 * Main Layout component.
 * Provides the application structure including sidebar, header with breadcrumbs, and footer.
 *
 * @component
 */
import LanguageSwitcher from "./language-switcher.vue";
import NavigationSidebar from "./navigation-sidebar.vue";
import FooterContent from "./footer-content.vue";
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const sidebarCollapsed = ref(false);

/**
 * Computed breadcrumb trail based on the current route hierarchy and meta information.
 * Supports a single parent level via the `parent` and `parentRoute` meta fields.
 * @returns {Array<{title: string, to: Object|null}>} Array of breadcrumb objects.
 */
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

  <div class="layout-container">
    <navigation-sidebar v-model:collapsed="sidebarCollapsed" />

    <div class="content-wrapper">
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

      <main class="main-content">
        <router-view />
      </main>

      <footer-content />
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
  background-color: #F8F4ED;
  padding-left: 80px;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-header {
  height: 80px;
  background-color: #F8F4ED;
  padding: 0 32px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
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

.main-content {
  flex: 1;
  padding: 24px 32px;
}
</style>
