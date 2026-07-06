<script setup>
/**
 * NavigationSidebar component.
 * Collapsible sidebar for application-wide navigation.
 *
 * @component
 */
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import useIamStore from '../../../iam/application/iam.store.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

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
 * Primary navigation for the grower (producer) segment.
 * @type {import('vue').ComputedRef<Array<{label: string, route: string, iconPath: string}>>}
 */
const growerItems = computed(() => [
  {
    label: t('sidebar.dashboard'),
    route: '/dashboard',
    iconPath: '/assets/icons/dashboard/grid-outline.svg',
    exact: true
  },
  {
    label: t('sidebar.myPlots'),
    route: '/agronomic/plots',
    iconPath: '/assets/icons/dashboard/file-tray-stacked-outline.svg'
  },
  {
    label: t('sidebar.iotDevices'),
    route: '/agronomic/iot-devices',
    iconPath: '/assets/icons/dashboard/construct-outline.svg'
  },
  {
    label: t('sidebar.alerts'),
    route: '/surveillance/alerts',
    iconPath: '/assets/icons/dashboard/megaphone-outline.svg'
  },
  {
    label: t('sidebar.dynamicNutrition'),
    route: '/agronomic/dynamic-nutrition',
    iconPath: '/assets/icons/dashboard/leaf-outline.svg'
  },
  {
    label: t('sidebar.pestSurveillance'),
    route: '/surveillance/pest-surveillance',
    iconPath: '/assets/icons/dashboard/bug-outline.svg'
  },
  {
    label: t('sidebar.expertAssistance'),
    route: '/assistance/expert-assistance',
    iconPath: '/assets/icons/dashboard/people-outline.svg'
  },
  {
    label: t('sidebar.expenseHistory'),
    route: '/agronomic/expense-history',
    iconPath: '/assets/icons/dashboard/sync-outline.svg'
  },
  {
    label: t('sidebar.interventions'),
    route: '/assistance/interventions',
    iconPath: '/assets/icons/dashboard/construct-outline.svg'
  }
]);

/**
 * Primary navigation for the specialist segment. Distinct workspace: the
 * specialist reviews incoming producer requests and manages field
 * interventions rather than tending their own plots.
 * @type {import('vue').ComputedRef<Array<{label: string, route: string, iconPath: string}>>}
 */
const specialistItems = computed(() => [
  {
    label: t('sidebar.dashboard'),
    route: '/dashboard',
    iconPath: '/assets/icons/dashboard/grid-outline.svg',
    exact: true
  },
  {
    label: t('sidebar.interventionMarketplace'),
    route: '/specialist/marketplace',
    iconPath: '/assets/icons/dashboard/construct-outline.svg'
  },
  {
    label: t('sidebar.myRequests'),
    route: '/specialist/requests',
    iconPath: '/assets/icons/dashboard/file-tray-stacked-outline.svg'
  },
  {
    label: t('sidebar.fieldInspection'),
    route: '/specialist/field-inspection',
    iconPath: '/assets/icons/dashboard/megaphone-outline.svg'
  }
]);

/**
 * Primary navigation, chosen by the signed-in user's segment.
 * @type {import('vue').ComputedRef<Array<{label: string, route: string, iconPath: string}>>}
 */
const mainItems = computed(() => iamStore.isSpecialist ? specialistItems.value : growerItems.value);

/**
 * Secondary navigation items (utility/settings).
 * @type {import('vue').ComputedRef<Array<{label: string, route: string, iconPath: string}>>}
 */
const secondaryItems = computed(() => [
  {
    label: t('sidebar.settings'),
    route: '/settings',
    iconPath: '/assets/icons/dashboard/settings-outline.svg'
  },
  {
    label: t('sidebar.subscription'),
    route: '/billing/subscription',
    iconPath: '/assets/icons/dashboard/diamond-outline.svg'
  },
  {
    label: t('sidebar.support'),
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
    '--icon-url': `url("${path}")`
  };
};

/**
 * Checks if the given route path is the currently active one.
 * @param {string} targetPath - The path to check against the current route.
 * @returns {boolean} True if the path is active.
 */
const isRouteActive = (targetPath, exact = false) => {
  return exact ? route.path === targetPath : route.path === targetPath || route.path.startsWith(`${targetPath}/`);
};

function logout() {
  iamStore.signOut();
  router.push({ name: 'iam-sign-in' });
}
</script>

<template>
  <aside class="dashboard-sidebar" :class="{ 'is-collapsed': collapsed }">
    <button
        class="collapse-button"
        type="button"
        :aria-label="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        @click="toggleSidebar"
    >
      <span class="pi" :class="collapsed ? 'pi-chevron-right' : 'pi-chevron-left'"></span>
    </button>

    <div class="sidebar-brand">
      <img src="/assets/icons/dashboard/viora-isotipo-green.png" alt="Viora" class="brand-logo" />
      <strong v-if="!collapsed">{{ t('sidebar.brand') }}</strong>
    </div>

    <nav class="sidebar-nav" :aria-label="t('sidebar.navigation')">
      <div class="nav-group">
        <router-link
            v-for="item in mainItems"
            :key="item.route"
            :to="item.route"
            class="nav-item"
            :class="{ 'is-active': isRouteActive(item.route, item.exact) }"
            :aria-label="item.label"
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
            :aria-label="item.label"
        >
          <div class="nav-icon" :style="getIconStyle(item.iconPath)"></div>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-user">
      <img class="user-avatar" src="/assets/images/dashboard/user-avatar.png" alt="User avatar" />
      <div v-if="!collapsed" class="user-info">
        <span>{{ t('sidebar.welcomeBack') }}</span>
        <strong>{{ iamStore.currentFullName || iamStore.currentEmail || 'Viora user' }}</strong>
      </div>
      <button v-if="!collapsed" class="logout-button" @click="logout" :aria-label="'Sign out'">
        <span class="pi pi-sign-out"></span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.dashboard-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1100;
  width: var(--viora-sidebar-width);
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--viora-surface);
  border-radius: 0 18px 18px 0;
  box-shadow: var(--viora-shadow);
  color: var(--viora-text-muted);
  transition: width 220ms ease;
  overflow: visible;
}

.dashboard-sidebar.is-collapsed {
  width: var(--viora-sidebar-collapsed-width);
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
  border: 1px solid var(--viora-border);
  border-radius: 999px;
  background: var(--viora-surface);
  color: var(--viora-primary);
  box-shadow: 0 8px 18px rgba(31, 37, 35, 0.08);
  cursor: pointer;
}

.sidebar-brand {
  min-height: 82px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 22px 16px;
  color: var(--viora-primary-dark);
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
  font-family: var(--viora-font);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.1;
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
  border-top: 1px solid var(--viora-border);
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
  color: var(--viora-text-muted);
  text-decoration: none;
  font-family: var(--viora-font);
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
  background: var(--viora-bg);
  color: var(--viora-primary);
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
  background: currentColor;
  mask: var(--icon-url) center / contain no-repeat;
  -webkit-mask: var(--icon-url) center / contain no-repeat;
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
  border-top: 1px solid var(--viora-border);
}

.dashboard-sidebar.is-collapsed .sidebar-user {
  justify-content: center;
  padding-inline: 0;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  object-fit: cover;
  background: var(--viora-surface-soft);
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.user-info span {
  color: #8a9c92;
  font-family: var(--viora-font);
  font-size: 12px;
}

.user-info strong {
  color: var(--viora-primary-dark);
  font-family: var(--viora-font);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.user-action {
  margin-left: auto;
  color: var(--viora-primary-dark);
  text-decoration: none;
}

.logout-button {
  margin-left: auto;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid var(--viora-border);
  border-radius: 8px;
  background: transparent;
  color: #8c877f;
  cursor: pointer;
  transition: all 180ms ease;
}

.logout-button:hover {
  background: rgba(229, 53, 53, 0.08);
  color: #e53535;
  border-color: #e53535;
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
