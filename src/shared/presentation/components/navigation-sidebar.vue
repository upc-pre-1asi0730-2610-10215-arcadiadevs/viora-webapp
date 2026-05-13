<script setup>
/**
 * NavigationSidebar component.
 * Collapsible sidebar for application-wide navigation.
 *
 * @component
 */
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();

const props = defineProps({
  /**
   * Whether the sidebar is currently in a collapsed state.
   */
  collapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:collapsed']);

/**
 * Toggles the sidebar collapsed state.
 */
const toggleSidebar = () => {
  emit('update:collapsed', !props.collapsed);
};

/**
 * Primary navigation items for the sidebar.
 * @type {import('vue').ComputedRef<Array<{label: string, route: string, iconPath: string}>>}
 */
const mainItems = computed(() => [
  {
    label: t('dashboard.sidebar.dashboard'),
    route: '/dashboard',
    iconPath: '/assets/icons/dashboard/grid-outline.svg'
  },
  {
    label: t('dashboard.sidebar.my-plots'),
    route: '/plots',
    iconPath: '/assets/icons/dashboard/file-tray-stacked-outline.svg'
  },
  {
    label: t('dashboard.sidebar.iot-devices'),
    route: '/agronomic/iot-devices',
    iconPath: '/assets/icons/dashboard/construct-outline.svg'
  },
  {
    label: t('dashboard.sidebar.alerts'),
    route: '/alerts',
    iconPath: '/assets/icons/dashboard/megaphone-outline.svg'
  },
  {
    label: t('dashboard.sidebar.dynamic-nutrition'),
    route: '/dynamic-nutrition',
    iconPath: '/assets/icons/dashboard/leaf-outline.svg'
  },
  {
    label: t('dashboard.sidebar.pest-surveillance'),
    route: '/pest-surveillance',
    iconPath: '/assets/icons/dashboard/bug-outline.svg'
  },
  {
    label: t('dashboard.sidebar.expert-assistance'),
    route: '/expert-assistance',
    iconPath: '/assets/icons/dashboard/people-outline.svg'
  },
  {
    label: t('dashboard.sidebar.expense-history'),
    route: '/expense-history',
    iconPath: '/assets/icons/dashboard/sync-outline.svg'
  }
]);

/**
 * Secondary navigation items (utility/settings).
 * @type {import('vue').ComputedRef<Array<{label: string, route: string, iconPath: string}>>}
 */
const secondaryItems = computed(() => [
  {
    label: t('dashboard.sidebar.settings'),
    route: '/settings',
    iconPath: '/assets/icons/dashboard/settings-outline.svg'
  },
  {
    label: t('dashboard.sidebar.subscription'),
    route: '/subscription',
    iconPath: '/assets/icons/dashboard/diamond-outline.svg'
  },
  {
    label: t('dashboard.sidebar.support'),
    route: '/support',
    iconPath: '/assets/icons/dashboard/information-circle-outline.svg'
  }
]);

/**
 * Generates the CSS mask style for SVG icons.
 * @param {string} path - The path to the SVG icon asset.
 * @returns {Object} CSS style object with the --icon-url variable.
 */
const getIconStyle = (path) => {
  return {
    backgroundColor: 'currentColor',
    mask: `url("${path}") center / contain no-repeat`,
    WebkitMask: `url("${path}") center / contain no-repeat`
  };
};

/**
 * Checks if the given route path is the currently active one.
 * @param {string} targetPath - The path to check against the current route.
 * @returns {boolean} True if the path is active.
 */
const isRouteActive = (targetPath) => {
  return route.path === targetPath;
};
</script>

<template>
  <aside class="dashboard-sidebar" :class="{ 'is-collapsed': collapsed }">
    <button class="collapse-button" @click="toggleSidebar">
      <span class="pi" :class="collapsed ? 'pi-chevron-right' : 'pi-chevron-left'"></span>
    </button>

    <div class="sidebar-brand">
      <img src="/favicon.svg" alt="Viora Logo" class="brand-logo" />
      <strong v-if="!collapsed">VIORA</strong>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-group">
        <router-link
            v-for="item in mainItems"
            :key="item.route"
            :to="item.route"
            class="nav-item"
            :class="{ 'is-active': isRouteActive(item.route) }"
        >
          <div class="nav-icon" :style="getIconStyle(item.iconPath)"></div>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>

      <div class="nav-group secondary">
        <router-link
            v-for="item in secondaryItems"
            :key="item.route"
            :to="item.route"
            class="nav-item"
            :class="{ 'is-active': isRouteActive(item.route) }"
        >
          <div class="nav-icon" :style="getIconStyle(item.iconPath)"></div>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-user">
      <div class="user-avatar-placeholder">
        <i class="pi pi-user"></i>
      </div>
      <div v-if="!collapsed" class="user-info">
        <strong>Jane Doe</strong>
        <span>Producer</span>
      </div>
      <router-link v-if="!collapsed" to="/profile" class="user-action">
        <i class="pi pi-ellipsis-v"></i>
      </router-link>
    </div>
  </aside>
</template>

<style scoped>
.dashboard-sidebar {
  --sidebar-width: 272px;
  --sidebar-collapsed-width: 80px;
  --sidebar-bg: #ffffff;
  --dashboard-bg: #f8f4ed;
  --active-color: #2e4a3a;
  --inactive-color: #4f4f4f;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 1100;
  width: var(--sidebar-width);
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--sidebar-bg);
  border-radius: 0 18px 18px 0;
  box-shadow: 0 16px 40px rgba(31, 37, 35, 0.08);
  color: var(--inactive-color);
  transition: width 220ms ease;
  overflow: visible;
}

.dashboard-sidebar.is-collapsed {
  width: var(--sidebar-collapsed-width);
}

.collapse-button {
  position: absolute;
  top: 22px;
  right: -13px;
  z-index: 10;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid #edf0ec;
  border-radius: 999px;
  background: #ffffff;
  color: var(--active-color);
  box-shadow: 0 8px 18px rgba(31, 37, 35, 0.08);
  cursor: pointer;
}

.sidebar-brand {
  min-height: 82px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 22px 16px;
  color: #18221d;
}

.dashboard-sidebar.is-collapsed .sidebar-brand {
  justify-content: center;
  padding-inline: 0;
}

.brand-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar-brand strong {
  font-family: 'Poppins', sans-serif;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.nav-group {
  display: grid;
  gap: 6px;
  padding: 10px 22px;
}

.nav-group.secondary {
  margin-top: 18px;
  padding-top: 24px;
  border-top: 1px solid #edf0ec;
}

.dashboard-sidebar.is-collapsed .nav-group {
  padding-inline: 14px;
}

.nav-item {
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  border-radius: 999px;
  color: var(--inactive-color);
  text-decoration: none;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  transition: all 180ms ease;
}

.dashboard-sidebar.is-collapsed .nav-item {
  justify-content: center;
  padding: 0;
}

.nav-item:hover,
.nav-item.is-active {
  background: var(--dashboard-bg);
  color: var(--active-color);
}

.nav-item:hover {
  transform: translateX(2px);
}

.dashboard-sidebar.is-collapsed .nav-item:hover {
  transform: none;
}

.nav-icon {
  width: 21px;
  height: 21px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

.sidebar-user {
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  border-top: 1px solid #edf0ec;
}

.dashboard-sidebar.is-collapsed .sidebar-user {
  justify-content: center;
  padding-inline: 0;
}

.user-avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #f2f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8C877F;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
  display: grid;
  gap: 2px;
  font-family: 'Poppins', sans-serif;
}

.user-info span {
  color: #8a9c92;
  font-size: 12px;
}

.user-info strong {
  color: #18221d;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.user-action {
  margin-left: auto;
  color: #18221d;
  text-decoration: none;
}

@media (max-width: 900px) {
  .dashboard-sidebar {
    position: fixed;
    z-index: 1100;
    left: 0;
    top: 0;
    height: 100vh;
    border-radius: 0 18px 18px 0;
    margin-right: 0;
  }
}
</style>
