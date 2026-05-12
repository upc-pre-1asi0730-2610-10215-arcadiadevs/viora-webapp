import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,

});

/**
 * Global navigation guard that updates the document title and delegates auth when enabled.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @param {import('vue-router').RouteLocationNormalized} from - Previous route.
 * @param {import('vue-router').NavigationGuardNext} next - Guard continuation callback.
 * @returns {void}
 */
router.beforeEach((to, from, next) => {
    console.log(`Navigating from ${from.name} to ${to.name}`);
    // Set the page title
    let baseTitle = 'Dashboard';
    // We can't use t() here easily without importing i18n,
    // so we'll just use the raw key or a simplified title for the browser tab.
    document.title = `${baseTitle} - ${to.name}`;
    // When IAM is implemented, use:
    // return authenticationGuard(to, from, next);
    // if not, use:
    return next();
});

export default router;