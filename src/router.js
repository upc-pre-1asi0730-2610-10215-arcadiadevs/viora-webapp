import { createRouter, createWebHistory } from "vue-router";
import agronomicRoutes from "./agronomic/presentation/agronomic-routes.js";

const producerDashboard = () => import('./shared/presentation/views/dashboard-producer.vue');

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
        path: '/agronomic', 
        name: 'agronomic', 
        children: agronomicRoutes 
    },
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