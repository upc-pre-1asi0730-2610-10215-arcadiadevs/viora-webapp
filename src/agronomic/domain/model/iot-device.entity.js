/**
 * IoT Device entity representing a sensor unit in the plot.
 * 
 * @class IotDevice
 */
export class IotDevice {
    /**
     * @param {Object} [data={}] - Initial data.
     * @param {number|string|null} [data.id=null] - Unique identifier.
     * @param {string} [data.name=''] - Device name or tag.
     * @param {number|string|null} [data.plotId=null] - Associated plot ID.
     * @param {number} [data.soilMoisture=0] - Current soil moisture reading (%).
     * @param {number} [data.temperature=0] - Current temperature reading (°C).
     * @param {number} [data.leafHumidity=0] - Current leaf humidity reading (%).
     * @param {string} [data.status='active'] - Operational status.
     * @param {string|Date} [data.lastUpdate=new Date()] - Last synchronization date.
     */
    constructor({
        id = null,
        name = '',
        plotId = null,
        soilMoisture = 0,
        temperature = 0,
        leafHumidity = 0,
        status = 'active',
        lastUpdate = new Date()
    } = {}) {
        this.id = id;
        this.name = name;
        this.plotId = plotId;
        this.soilMoisture = soilMoisture;
        this.temperature = temperature;
        this.leafHumidity = leafHumidity;
        this.status = status;
        this.lastUpdate = lastUpdate;
    }
}