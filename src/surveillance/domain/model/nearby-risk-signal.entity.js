/**
 * NearbyRiskSignal entity representing a single risk signal detected
 * in the community surrounding a given plot.
 * @class NearbyRiskSignal
 */
export class NearbyRiskSignal {
    /**
     * @param {Object} params
     * @param {number|null} [params.id=null]
     * @param {string} [params.title='']
     * @param {number} [params.distanceKm=0]
     * @param {string} [params.severity='Low']
     * @param {string} [params.probableThreat='']
     */
    constructor({
        id = null,
        title = '',
        distanceKm = 0,
        severity = 'Low',
        probableThreat = ''
    }) {
        this.id = id;
        this.title = title;
        this.distanceKm = distanceKm;
        this.severity = severity;
        this.probableThreat = probableThreat;
    }
}

/**
 * CommunityRiskSnapshot entity representing a snapshot of community risk
 * for a given plot and radius.
 * @class CommunityRiskSnapshot
 */
export class CommunityRiskSnapshot {
    /**
     * @param {Object} params
     * @param {string} [params.plotName='']
     * @param {number} [params.radiusKm=0]
     * @param {NearbyRiskSignal[]} [params.signals=[]]
     * @param {string[]} [params.preventiveRecommendations=[]]
     */
    constructor({
        plotName = '',
        radiusKm = 0,
        signals = [],
        preventiveRecommendations = []
    }) {
        this.plotName = plotName;
        this.radiusKm = radiusKm;
        this.signals = signals;
        this.preventiveRecommendations = preventiveRecommendations;
    }
}
