/**
 * @file plot-registration.entity.js
 * @description Domain entity for the result of registering a plot, used by the
 * Create Plot wizard's confirmation step. Mirrors the platform
 * `PlotRegistrationResource` contract.
 */

/**
 * @typedef {'active'|'initializing'|'not-linked'|'unknown'} MonitoringLinkStatus
 */

/**
 * @class PlotRegistration
 */
export class PlotRegistration {
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
     * @param {string} [params.state='']
     * @param {MonitoringLinkStatus} [params.climateMonitoring='unknown']
     * @param {MonitoringLinkStatus} [params.satelliteNdvi='unknown']
     * @param {MonitoringLinkStatus} [params.iotDevices='unknown']
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
                    state = '',
                    climateMonitoring = 'unknown',
                    satelliteNdvi = 'unknown',
                    iotDevices = 'unknown'
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
        this.state = state;
        this.climateMonitoring = climateMonitoring;
        this.satelliteNdvi = satelliteNdvi;
        this.iotDevices = iotDevices;
    }

    /** @returns {string} Area label, e.g. "12.5 ha". */
    get areaLabel() {
        return `${this.areaSizeHectares.toFixed(1)} ha`;
    }
}
