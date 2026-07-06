// Lazy-loaded components
const subscriptionOverview = () => import('./views/subscription-overview.vue');

/**
 * Child routes exposed by the Billing presentation layer.
 *
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const billingRoutes = [
    {
        path: '',
        name: 'billing-index',
        redirect: { name: 'billing-subscription' },
    },
    {
        path: 'subscription',
        name: 'billing-subscription',
        component: subscriptionOverview,
        meta: {
            title: 'Subscription',
            description: 'subscription.overview-description',
        },
    },
];

export default billingRoutes;
