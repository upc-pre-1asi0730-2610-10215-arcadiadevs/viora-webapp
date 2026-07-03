const settingsOverview = () => import('./views/settings-overview.vue');

/**
 * Child routes exposed by the Profile presentation layer.
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const profileRoutes = [
    {
        path: '',
        name: 'settings-overview',
        component: settingsOverview,
        meta: {
            title: 'Settings',
            description: 'Manage your account, marketplace visibility, and security preferences.',
        },
    },
];

export default profileRoutes;
