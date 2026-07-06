const expertAssistanceOverview = () => import('./views/expert-assistance-overview.vue');
const caseDetail = () => import('./views/case-detail.vue');
const interventionsOverview = () => import('./views/interventions-overview.vue');

/**
 * Child routes exposed by the Intervention presentation layer.
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const interventionRoutes = [
    {
        path: '',
        name: 'intervention-index',
        redirect: { name: 'intervention-expert-assistance' }
    },
    {
        path: 'expert-assistance',
        name: 'intervention-expert-assistance',
        component: expertAssistanceOverview,
        meta: {
            title: 'Expert Assistance',
            description: 'Find available phytosanitary specialists near your active alerts.'
        }
    },
    {
        path: 'expert-assistance/request',
        redirect: { name: 'intervention-expert-assistance' }
    },
    {
        path: 'expert-assistance/case/:code',
        name: 'intervention-case-detail',
        component: caseDetail,
        meta: {
            title: 'Case Detail',
            description: 'Track this assistance case and coordinate the field visit.'
        }
    },
    {
        path: 'interventions',
        name: 'intervention-interventions',
        component: interventionsOverview,
        meta: {
            title: 'Interventions',
            description: 'Track technical interventions linked to alerts, proposals and field prescriptions.'
        }
    }
];

export default interventionRoutes;
