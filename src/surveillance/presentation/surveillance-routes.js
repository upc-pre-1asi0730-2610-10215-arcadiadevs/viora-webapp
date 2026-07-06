const alertsOverview = () => import('./views/alerts-overview.vue');
const pestSurveillanceOverview = () => import('./views/pest-surveillance-overview.vue');

/**
 * Child routes exposed by the Surveillance presentation layer.
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const surveillanceRoutes = [
    {
        path: '',
        name: 'surveillance-index',
        redirect: { name: 'surveillance-alerts' }
    },
    {
        path: 'alerts',
        name: 'surveillance-alerts',
        component: alertsOverview,
        meta: {
            title: 'surveillance.alerts-title',
            description: 'surveillance.alerts-description'
        }
    },
    {
        path: 'pest-surveillance',
        name: 'surveillance-pest-surveillance',
        component: pestSurveillanceOverview,
        meta: {
            title: 'surveillance.pest-surveillance-title',
            description: 'surveillance.pest-surveillance-description'
        }
    },
    {
        path: 'pest-surveillance/report-symptoms',
        redirect: { name: 'surveillance-pest-surveillance' }
    }
];

export default surveillanceRoutes;
