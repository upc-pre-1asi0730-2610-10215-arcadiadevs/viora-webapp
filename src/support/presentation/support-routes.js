// Lazy-loaded components
const supportOverview = () => import('./views/support-overview.vue');

/**
 * Child routes exposed by the Support presentation layer.
 *
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const supportRoutes = [
    {
        path: '',
        name: 'support-overview',
        component: supportOverview,
        meta: {
            title: 'Support',
            description: 'support.overview-description',
        },
    },
];

export default supportRoutes;
