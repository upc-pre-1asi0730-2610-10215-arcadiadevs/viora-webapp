import { createRouter, createWebHistory } from "vue-router";
import agronomicRoutes from "./agronomic/presentation/agronomic-routes.js";
import surveillanceRoutes from "./surveillance/presentation/surveillance-routes.js";
import interventionRoutes from "./intervention/presentation/intervention-routes.js";
import profileRoutes from "./profile/presentation/profile-routes.js";
import billingRoutes from "./billing/presentation/billing-routes.js";
import supportRoutes from "./support/presentation/support-routes.js";
import workspaceRoutes from "./shared/presentation/workspace-routes.js";
import iamRoutes from "./iam/presentation/iam-routes.js";
import { authenticationGuard } from "./iam/infrastructure/authentication.guard.js";

const signInForm = () => import('./iam/presentation/views/sign-in-form.vue');
const signUpForm = () => import('./iam/presentation/views/sign-up-form.vue');
const verifyPage = () => import('./iam/presentation/views/verify-page.vue');
const dashboardRoleView = () => import('./shared/presentation/views/dashboard-role-view.vue');
const myPlotsOverviewPage = () => import('./agronomic/presentation/views/my-plots-overview.vue');
const plotFormPage = () => import('./agronomic/presentation/views/plot-form-page.vue');
const plotDetailPage = () => import('./agronomic/presentation/views/plot-detail-page.vue');
const dynamicNutritionPage = () => import('./agronomic/presentation/views/dynamic-nutrition-page.vue');
const plotOverviewPage = () => import('./agronomic/presentation/views/plot-overview-page.vue');
const weatherPage = () => import('./agronomic/presentation/views/weather-page.vue');

const routes = [
    {
        path: '/login',
        name: 'iam-sign-in',
        component: signInForm,
        meta: { title: 'Sign in', public: true, guest: true }
    },
    {
        path: '/register',
        name: 'iam-sign-up',
        component: signUpForm,
        meta: { title: 'Create account', public: true, guest: true }
    },
    {
        path: '/verify',
        name: 'iam-verify',
        component: verifyPage,
        meta: { title: 'Verify email', public: true }
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: dashboardRoleView,
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
    { path: '/agronomic/dynamic-nutrition/plan', redirect: { name: 'dynamic-nutrition' } },
    { path: '/plots', redirect: { name: 'my-plots' } },
    { path: '/plots/details', redirect: { name: 'my-plots' } },
    { path: '/alerts', redirect: { name: 'surveillance-alerts' } },
    { path: '/producer/iot-devices', redirect: { name: 'agronomic-iot-devices' } },
    { path: '/producer/iot-devices/new', redirect: { name: 'agronomic-iot-device-new' } },
    {
        path: '/producer/iot-devices/:id/edit',
        redirect: to => ({ name: 'agronomic-iot-device-edit', params: { id: to.params.id } })
    },
    { path: '/dynamic-nutrition', redirect: { name: 'dynamic-nutrition' } },
    { path: '/dynamic-nutrition/plan', redirect: { name: 'dynamic-nutrition' } },
    { path: '/pest-surveillance', redirect: { name: 'surveillance-pest-surveillance' } },
    { path: '/pest-surveillance/report-symptoms', redirect: { name: 'surveillance-pest-surveillance' } },
    { path: '/expert-assistance', redirect: { name: 'intervention-expert-assistance' } },
    { path: '/expert-assistance/request', redirect: { name: 'intervention-expert-assistance' } },
    { path: '/interventions', redirect: { name: 'intervention-interventions' } },
    { path: '/expense-history', redirect: { name: 'agronomic-expense-history' } },
    { path: '/subscription', redirect: { name: 'billing-subscription' } },
    {
        path: '/agronomic',
        name: 'agronomic',
        children: agronomicRoutes
    },
    {
        path: '/surveillance',
        name: 'surveillance',
        children: surveillanceRoutes
    },
    {
        path: '/assistance',
        name: 'assistance',
        children: interventionRoutes
    },
    {
        path: '/settings',
        name: 'settings',
        children: profileRoutes
    },
    {
        path: '/billing',
        name: 'billing',
        children: billingRoutes
    },
    {
        path: '/support',
        name: 'support',
        children: supportRoutes
    },
    {
        path: '/iam',
        name: 'iam',
        children: iamRoutes
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

router.beforeEach((to, from, next) => {
    document.title = `Dashboard - ${to.meta.title ?? to.name}`;
    const result = authenticationGuard(to, from);
    if (result === true) {
        next();
    } else {
        next(result);
    }
});

export default router;
