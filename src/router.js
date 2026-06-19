import { createRouter, createWebHistory } from "vue-router";
import agronomicRoutes from "./agronomic/presentation/agronomic-routes.js";
import workspaceRoutes from "./shared/presentation/workspace-routes.js";

const producerDashboard = () => import('./shared/presentation/views/dashboard-producer.vue');
const myPlotsOverviewPage = () => import('./agronomic/presentation/views/my-plots-overview.vue');
const plotFormPage = () => import('./agronomic/presentation/views/plot-form-page.vue');
const plotDetailPage = () => import('./agronomic/presentation/views/plot-detail-page.vue');
const dynamicNutritionPage = () => import('./agronomic/presentation/views/dynamic-nutrition-page.vue');
const plotOverviewPage = () => import('./agronomic/presentation/views/plot-overview-page.vue');
const weatherPage = () => import('./agronomic/presentation/views/weather-page.vue');

/**
 * Main application router.
 */
const routes = [
    {
        path: '/dashboard',
        name: 'dashboard',
        component: producerDashboard,
        meta: {
            title: 'option.dashboard',
            description: 'dashboard.header-description'
        }
    },
    {
        path: '/dashboard/plot-overview/:plotId?',
        name: 'dashboard-plot-overview',
        component: plotOverviewPage,
        meta: {
            title: 'dashboard.plot-overview-title',
            description: 'dashboard.plot-overview-description'
        }
    },
    {
        path: '/dashboard/weather/:plotId?',
        name: 'dashboard-weather',
        component: weatherPage,
        meta: {
            title: 'dashboard.weather-title',
            description: 'dashboard.weather-description'
        }
    },
    {
        path: '/agronomic/plots',
        name: 'my-plots',
        component: myPlotsOverviewPage,
        meta: {
            title: 'sidebar.myPlots',
            description: 'myPlots.subtitle'
        }
    },
    {
        path: '/agronomic/plots/new',
        name: 'my-plots-create',
        component: plotFormPage,
        meta: {
            title: 'plotCreate.title',
            description: 'plotCreate.subtitle'
        }
    },
    {
        path: '/agronomic/plots/:id/edit',
        name: 'my-plots-edit',
        component: plotFormPage,
        meta: {
            title: 'plotCreate.edit.title',
            description: 'plotCreate.edit.subtitle'
        }
    },
    {
        path: '/agronomic/plots/:id',
        name: 'my-plots-detail',
        component: plotDetailPage,
        meta: {
            title: 'plotDetail.title',
            description: 'plotDetail.subtitle'
        }
    },
    {
        path: '/agronomic/dynamic-nutrition',
        name: 'dynamic-nutrition',
        component: dynamicNutritionPage,
        meta: {
            title: 'sidebar.dynamicNutrition',
            description: 'dynamicNutrition.subtitle'
        }
    },
    {
        path: '/agronomic',
        name: 'agronomic',
        children: agronomicRoutes
    },
    ...workspaceRoutes,
    {
        path: '/',
        redirect: '/dashboard'
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes
});

/**
 * Global navigation guard for updating document title.
 */
router.beforeEach((to, from, next) => {
    document.title = `Dashboard - ${to.name}`;
    return next();
});

export default router;
