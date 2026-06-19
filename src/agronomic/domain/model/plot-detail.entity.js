/**
 * @file plot-detail.entity.js
 * @description Domain entity for the "My Plots / Plot Detail" screen. Mirrors the
 * platform `PlotDetailResource` contract (configuration, boundary status,
 * monitoring links, IoT activity and recent configuration activity).
 */

/**
 * @typedef {'active'|'initializing'|'not-linked'|'unknown'} MonitoringLinkStatus
 */

/**
 * @class PlotDetail
 */
export class PlotDetail {
    /**
     * @param {Object} params
     * @param {number|string|null} [params.id=null]
     * @param {string} [params.name='']
     * @param {string} [params.location='']
     * @param {string} [params.campaign='']
     * @param {string} [params.cropType='']
     * @param {string} [params.variety='']
     * @param {string} [params.notes='']
     * @param {Array<Array<number>>} [params.polygonCoordinates=[]]
     * @param {number} [params.areaSizeHectares=0]
     * @param {number} [params.boundaryPointCount=0]
     * @param {string} [params.boundaryStatus='']
     * @param {string} [params.registeredAt='']
     * @param {string} [params.lastConfigurationUpdateAt='']
     * @param {MonitoringLinkStatus} [params.climateMonitoring='unknown']
     * @param {MonitoringLinkStatus} [params.satelliteNdvi='unknown']
     * @param {string} [params.climateLastSyncAt='']
     * @param {string} [params.satelliteLastSyncAt='']
     * @param {MonitoringLinkStatus} [params.iotStatus='unknown']
     * @param {number} [params.linkedDeviceCount=0]
     * @param {number} [params.onlineDeviceCount=0]
     * @param {string} [params.iotLastActivityAt='']
     * @param {Array<Object>} [params.devices=[]]
     * @param {Array<Object>} [params.activity=[]]
     */
    constructor({
                    id = null,
                    name = '',
                    location = '',
                    campaign = '',
                    cropType = '',
                    variety = '',
                    notes = '',
                    polygonCoordinates = [],
                    areaSizeHectares = 0,
                    boundaryPointCount = 0,
                    boundaryStatus = '',
                    registeredAt = '',
                    lastConfigurationUpdateAt = '',
                    climateMonitoring = 'unknown',
                    satelliteNdvi = 'unknown',
                    climateLastSyncAt = '',
                    satelliteLastSyncAt = '',
                    iotStatus = 'unknown',
                    linkedDeviceCount = 0,
                    onlineDeviceCount = 0,
                    iotLastActivityAt = '',
                    devices = [],
                    activity = []
                } = {}) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.campaign = campaign;
        this.cropType = cropType;
        this.variety = variety;
        this.notes = notes;
        this.polygonCoordinates = polygonCoordinates;
        this.areaSizeHectares = areaSizeHectares;
        this.boundaryPointCount = boundaryPointCount;
        this.boundaryStatus = boundaryStatus;
        this.registeredAt = registeredAt;
        this.lastConfigurationUpdateAt = lastConfigurationUpdateAt;
        this.climateMonitoring = climateMonitoring;
        this.satelliteNdvi = satelliteNdvi;
        this.climateLastSyncAt = climateLastSyncAt;
        this.satelliteLastSyncAt = satelliteLastSyncAt;
        this.iotStatus = iotStatus;
        this.linkedDeviceCount = linkedDeviceCount;
        this.onlineDeviceCount = onlineDeviceCount;
        this.iotLastActivityAt = iotLastActivityAt;
        this.devices = devices;
        this.activity = activity;
    }

    /** @returns {string} Area label, e.g. "43.1 ha". */
    get areaLabel() {
        return `${this.areaSizeHectares.toFixed(1)} ha`;
    }

    /** @returns {boolean} Whether the backend marks the boundary as VALIDATED. */
    get boundaryValidated() {
        return this.boundaryStatus.trim().toUpperCase() === 'VALIDATED';
    }

    /** @returns {boolean} Whether the plot has at least one linked device. */
    get hasIot() {
        return this.linkedDeviceCount > 0;
    }
}
