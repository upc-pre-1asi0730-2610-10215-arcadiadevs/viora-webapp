/**
 * @file my-plots-overview.entity.js
 * @description Domain entities for the aggregated "My Plots / Overview" screen.
 * Mirrors the platform `MyPlotsOverviewResource` / `MyPlotOverviewResource`
 * contracts, exposing the derived labels the cards render.
 */

/**
 * Monitoring projection for a single plot in the My Plots overview list.
 * @class MyPlotOverviewItem
 */
export class MyPlotOverviewItem {
    /**
     * @param {Object} params
     * @param {number|string|null} [params.id=null]
     * @param {string} [params.name='']
     * @param {string} [params.location='']
     * @param {number} [params.areaSizeHectares=0]
     * @param {Array<Array<number>>} [params.polygonCoordinates=[]]
     * @param {'Healthy'|'Moderate'|'Critical'} [params.healthStatus='Healthy']
     * @param {'Low'|'Moderate'|'High'} [params.phenologicalRisk='Low']
     * @param {number} [params.currentNdvi=0]
     * @param {number} [params.chillPortions=0]
     * @param {number} [params.onlineDeviceCount=0]
     * @param {number} [params.activeAlertCount=0]
     * @param {string} [params.lastUpdatedAt='']
     */
    constructor({
                    id = null,
                    name = '',
                    location = '',
                    cropType = '',
                    areaSizeHectares = 0,
                    polygonCoordinates = [],
                    healthStatus = 'Healthy',
                    phenologicalRisk = 'Low',
                    currentNdvi = 0,
                    chillPortions = 0,
                    onlineDeviceCount = 0,
                    activeAlertCount = 0,
                    lastUpdatedAt = ''
                } = {}) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.cropType = cropType;
        this.areaSizeHectares = areaSizeHectares;
        this.polygonCoordinates = polygonCoordinates;
        this.healthStatus = healthStatus;
        this.phenologicalRisk = phenologicalRisk;
        this.currentNdvi = currentNdvi;
        this.chillPortions = chillPortions;
        this.onlineDeviceCount = onlineDeviceCount;
        this.activeAlertCount = activeAlertCount;
        this.lastUpdatedAt = lastUpdatedAt;
    }

    /** @returns {boolean} Whether the plot has at least one device online. */
    get hasIot() {
        return this.onlineDeviceCount > 0;
    }

    /** @returns {boolean} Whether the plot has at least one active alert. */
    get hasAlerts() {
        return this.activeAlertCount > 0;
    }

    /** @returns {string} "La Yarada · 12.5 ha" style line shown under the name. */
    get metaLabel() {
        const area = `${this.areaSizeHectares.toFixed(1)} ha`;
        return this.location ? `${this.location} · ${area}` : area;
    }

    /** @returns {string} NDVI rounded to two decimals for the indicator. */
    get ndviLabel() {
        return this.currentNdvi.toFixed(2);
    }

    /** @returns {string} Chill accumulation in chill portions, e.g. "602 CP". */
    get chillLabel() {
        return `${Math.round(this.chillPortions)} CP`;
    }
}

/**
 * Aggregated read model for the My Plots overview screen.
 * @class MyPlotsOverview
 */
export class MyPlotsOverview {
    /**
     * @param {Object} params
     * @param {number} [params.registeredPlotCount=0]
     * @param {number} [params.monitoredAreaHectares=0]
     * @param {number} [params.climateLinkedPlotCount=0]
     * @param {number} [params.onlineDeviceCount=0]
     * @param {MyPlotOverviewItem[]} [params.plots=[]]
     */
    constructor({
                    registeredPlotCount = 0,
                    monitoredAreaHectares = 0,
                    climateLinkedPlotCount = 0,
                    onlineDeviceCount = 0,
                    plots = []
                } = {}) {
        this.registeredPlotCount = registeredPlotCount;
        this.monitoredAreaHectares = monitoredAreaHectares;
        this.climateLinkedPlotCount = climateLinkedPlotCount;
        this.onlineDeviceCount = onlineDeviceCount;
        this.plots = plots;
    }

    /** @returns {number} Number of plots that have at least one device online. */
    get plotsWithIotCount() {
        return this.plots.filter((plot) => plot.hasIot).length;
    }

    /** @returns {boolean} Whether every registered plot is climate linked. */
    get allClimateLinked() {
        return (
            this.registeredPlotCount > 0 &&
            this.climateLinkedPlotCount >= this.registeredPlotCount
        );
    }

    /** @returns {string} Most recent plot update timestamp across the overview, if any. */
    get lastUpdatedAt() {
        return this.plots
            .map((plot) => plot.lastUpdatedAt)
            .filter((value) => Boolean(value))
            .sort((first, second) => Date.parse(second) - Date.parse(first))
            .at(0) ?? '';
    }
}
