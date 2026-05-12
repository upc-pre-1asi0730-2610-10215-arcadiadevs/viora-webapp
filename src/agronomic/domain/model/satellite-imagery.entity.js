/**
 * SatelliteImagery entity representing the AgroMonitoring NDVI heatmap metadata.
 * @class SatelliteImagery
 */
export class SatelliteImagery {
    /**
     * @param {Object} params
     * @param {string} [params.tileUrl=''] - Tile URL for Mapbox layer.
     * @param {string} [params.captureDate=''] - Satellite capture date.
     * @param {number} [params.ndviMean=0] - Average NDVI value of the tile.
     * @param {number} [params.cloudPercentage=0] - Cloud coverage percentage.
     */
    constructor({ tileUrl = '', captureDate = '', ndviMean = 0, cloudPercentage = 0 }) {
        this.tileUrl = tileUrl;
        this.captureDate = captureDate;
        this.ndviMean = ndviMean;
        this.cloudPercentage = cloudPercentage;
    }

    /**
     * Determines if the image is reliable based on low cloud coverage (threshold < 10%).
     * @returns {boolean}
     */
    get isReliable() {
        return this.cloudPercentage < 10;
    }

    /**
     * Returns an opacity value for Mapbox based on cloud interference.
     * @returns {number}
     */
    get recommendedOpacity() {
        return this.cloudPercentage > 20 ? 0.4 : 0.8;
    }
}