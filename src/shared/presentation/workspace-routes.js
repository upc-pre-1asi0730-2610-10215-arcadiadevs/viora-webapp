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
  // `/agronomic/plots`, `/agronomic/plots/new` and `/agronomic/plots/:id/edit`
  // are served by the real My Plots views (see router.js).
  // Routes with real views are registered in their feature route files:
  //   agronomic  → agronomic-routes.js (expense-history)
  //   surveillance → surveillance-routes.js
  //   intervention → intervention-routes.js
  //   billing     → billing-routes.js
  //   profile     → profile-routes.js
  //   support     → support-routes.js
  placeholder('/agronomic/plots/import', 'my-plots-import', 'plotImport.title', 'plotImport.subtitle'),
  placeholder('/profile', 'profile', 'sidebar.openProfile', 'comingSoon.subtitle-profile'),
  placeholder('/specialist', 'specialist-workspace', 'Specialist Workspace', 'Review producer requests, cases, and field interventions — coming soon.')
];

export default workspaceRoutes;
