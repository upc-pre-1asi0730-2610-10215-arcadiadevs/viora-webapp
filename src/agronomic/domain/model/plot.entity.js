/**
 * Plot entity representing a cultivated olive field area.
 * Updated to support Dashboard Overview features like Health Status and Risks.
 * @class Plot
 */
export class Plot {
    /**
     * @param {Object} params
     * @param {number} [params.id=null] - Unique identifier.
     * @param {string} [params.name=''] - Display name.
     * @param {string} [params.locationReference=''] - Geographical reference (e.g., 'La Yarada - Los Palos').
     * @param {Array<Array<number>>} [params.polygonCoordinates=[]] - GeoJSON for Mapbox.
     * @param {number} [params.areaSize=0] - Size in hectares.
     * @param {string} [params.lastUpdate=''] - Sync timestamp.
     * @param {import('./satellite-imagery.entity.js').SatelliteImagery|null} [params.currentImagery=null] - NDVI tile data.
     * @param {string} [params.healthStatus='Healthy'] - Categorized health (e.g., 'Healthy', 'Under Review').
     * @param {string} [params.phenologicalRisk='Low'] - Risk levels ('Low', 'Medium', 'High').
     */
    constructor({
                    id = null,
                    name = '',
                    locationReference = '',
                    polygonCoordinates = [],
                    areaSize = 0,
                    lastUpdate = '',
                    currentImagery = null,
                    healthStatus = 'Healthy',
                    phenologicalRisk = 'Low'
                }) {
        this.id = id;
        this.name = name;
        this.locationReference = locationReference;
        this.polygonCoordinates = polygonCoordinates;
        this.areaSize = areaSize;
        this.lastUpdate = lastUpdate;
        this.currentImagery = currentImagery;
        this.healthStatus = healthStatus;
        this.phenologicalRisk = phenologicalRisk;
    }

    /**
     * Calculates the estimated biomass for this plot based on a specific NDVI value.
     * Business Rule: Yield (t) = Area (ha) * NDVI Index.
     * @param {number} ndviValue - Current vegetation index.
     * @returns {number} Estimated biomass in tonnes.
     */
    calculateCurrentBiomass(ndviValue) {
        return Number((this.areaSize * ndviValue).toFixed(2));
    }

    /**
     * Checks if the plot has been offline (no telemetry received in the last 24h).
     * @returns {boolean}
     */
    get isOffline() {
        if (!this.lastUpdate) return true;
        const lastDate = new Date(this.lastUpdate);
        const diffInHours = (new Date() - lastDate) / (1000 * 60 * 60);
        return diffInHours > 24;
    }
}