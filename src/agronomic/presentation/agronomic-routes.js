// Lazy-loaded components
const iotDeviceList = () => import('./views/iot-device-list.vue');
const iotDeviceForm = () => import('./views/iot-device-form.vue');

/**
 * Child routes exposed by the Agronomic presentation layer.
 *
 * @type {import('vue-router').RouteRecordRaw[]}
 */
const agronomicRoutes = [
    {   
        path: 'iot-devices',             
        name: 'agronomic-iot-devices',      
        component: iotDeviceList, 
        meta: { 
            title: 'dashboard.sidebar.iot-devices',
            description: 'iot-devices.subtitle'
        }
    },
    {   
        path: 'iot-devices/new',         
        name: 'agronomic-iot-device-new',    
        component: iotDeviceForm, 
        meta: { 
            title: 'iot-devices.new-title',
            description: 'iot-devices.form-subtitle',
            parent: 'dashboard.sidebar.iot-devices',
            parentRoute: 'agronomic-iot-devices'
        }
    },
    {   
        path: 'iot-devices/:id/edit',    
        name: 'agronomic-iot-device-edit',   
        component: iotDeviceForm, 
        meta: { 
            title: 'iot-devices.edit-title',
            description: 'iot-devices.form-subtitle',
            parent: 'dashboard.sidebar.iot-devices',
            parentRoute: 'agronomic-iot-devices'
        }
    }
];

export default agronomicRoutes;