/**
 * Workspace placeholder routes.
 *
 * Sidebar destinations whose feature is not yet developed all resolve to the
 * global ComingSoon view, which reads its labels from each route's `meta`.
 * Mirrors the OS Angular `workspaceRoutes` placeholder tree. As each feature
 * ships, replace the corresponding entry with the real view.
 *
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const comingSoon = () => import('./views/coming-soon.vue');

const placeholder = (path, name, sectionLabel, subtitle) => ({
  path,
  name,
  component: comingSoon,
  meta: { title: sectionLabel, sectionLabel, subtitle }
});

const workspaceRoutes = [
  placeholder('/agronomic/plots', 'my-plots', 'sidebar.myPlots', 'comingSoon.subtitle-my-plots'),
  placeholder('/agronomic/dynamic-nutrition', 'dynamic-nutrition', 'sidebar.dynamicNutrition', 'comingSoon.subtitle-dynamic-nutrition'),
  placeholder('/surveillance/alerts', 'alerts', 'sidebar.alerts', 'comingSoon.subtitle-alerts'),
  placeholder('/surveillance/pest-surveillance', 'pest-surveillance', 'sidebar.pestSurveillance', 'comingSoon.subtitle-pest-surveillance'),
  placeholder('/assistance/expert-assistance', 'expert-assistance', 'sidebar.expertAssistance', 'comingSoon.subtitle-expert-assistance'),
  placeholder('/billing/expense-history', 'expense-history', 'sidebar.expenseHistory', 'comingSoon.subtitle-expense-history'),
  placeholder('/billing/subscription', 'subscription', 'sidebar.subscription', 'comingSoon.subtitle-subscription'),
  placeholder('/settings', 'settings', 'sidebar.settings', 'comingSoon.subtitle-settings'),
  placeholder('/support', 'support', 'sidebar.support', 'comingSoon.subtitle-support'),
  placeholder('/profile', 'profile', 'sidebar.openProfile', 'comingSoon.subtitle-profile')
];

export default workspaceRoutes;
