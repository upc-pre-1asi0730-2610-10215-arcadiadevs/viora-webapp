/**
 * Alert entity representing a critical surveillance event in the field.
 * This entity belongs to the Surveillance Bounded Context.
 * It uses a simplified Plot information (Value Object) to maintain context isolation.
 * @class Alert
 */

const THREAT_TYPE_LABELS = {
    PHENOLOGICAL_RISK: 'Phenological risk',
    CHILL_DEFICIT: 'Chill deficit warning',
    CLIMATE_EXTREME: 'Climate extreme warning',
    PEST_SYMPTOM: 'Pest symptom report',
    PEST_SYMPTOM_REPORT: 'Pest symptom report',
    COMMUNITY_PEST: 'Community pest alert',
    LOW_NDVI: 'Low NDVI zone',
    LOW_NDVI_ZONE: 'Low NDVI zone',
    HYDRIC_STRESS: 'Hydric stress warning',
    WATER_STRESS: 'Hydric stress warning',
    XYLELLA_RELATED: 'Xylella-related alert',
    OLIVE_FRUIT_FLY: 'Olive fruit fly',
    OLIVE_MOTH: 'Olive moth',
    PEACOCK_SPOT: 'Peacock spot',
    DISEASE_OUTBREAK: 'Disease outbreak',
    WEATHER_ANOMALY: 'Weather anomaly',
    IRRIGATION_ALERT: 'Irrigation alert',
    UNKNOWN: 'Agronomic alert'
};

const SOURCE_LABELS = {
    CLIMATE: 'Climate',
    MANUAL_REPORT: 'Manual report',
    COMMUNITY: 'Community',
    SATELLITE: 'Satellite',
    IOT: 'IoT',
    IOT_SENSOR: 'IoT',
    SYSTEM: 'System',
    AGRONOMIC_MODEL: 'Agronomic model'
};

const normalizeEnumKey = (value) => String(value ?? '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

const humanizeEnumValue = (value) => normalizeEnumKey(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export class Alert {
    /**
     * @param {Object} params
     * @param {number|null} [params.id=null]
     * @param {number|null} [params.reportId=null]
     * @param {number|null} [params.plotId=null]
     * @param {string} [params.type='']
     * @param {string} [params.severity='Low']
     * @param {string} [params.status='Pending']
     * @param {string} [params.title='']
     * @param {string} [params.description='']
     * @param {string} [params.date='']
     * @param {string} [params.riskExplanation='']
     * @param {string[]} [params.sources=[]]
     * @param {string[]} [params.dataProviders=[]]
     * @param {Object} [params.supportingData={}]
     * @param {Object} [params.plot={}]
     * @param {string} [params.plot.name='']
     * @param {string} [params.plot.location='']
     * @param {number} [params.plot.hectares=0]
     */
    constructor({
                    id = null,
                    reportId = null,
                    plotId = null,
                    type = '',
                    severity = 'Low',
                    status = 'Pending',
                    title = '',
                    description = '',
                    date = '',
                    riskExplanation = '',
                    sources = [],
                    dataProviders = [],
                    supportingData = {},
                    plot = {
                        name: '',
                        location: '',
                        hectares: 0
                    }
                }) {
        this.id = id;
        this.reportId = reportId;
        this.plotId = plotId;
        this.type = type;
        this.severity = severity;
        this.status = status;
        this.title = title;
        this.description = description;
        this.date = date;
        this.riskExplanation = riskExplanation;
        this.sources = sources;
        this.dataProviders = dataProviders;
        this.supportingData = supportingData;
        this.plot = plot;
    }

    get requiresUrgentAction() {
        return this.severity === 'High' && this.status === 'Pending';
    }

    /** @returns {string} Human-readable type label */
    get typeLabel() {
        const key = normalizeEnumKey(this.type);
        return THREAT_TYPE_LABELS[key] || humanizeEnumValue(this.type) || 'Agronomic alert';
    }

    /** @returns {string} Primary data source label */
    get primarySource() {
        if (!this.sources || this.sources.length === 0) return 'Not specified';
        const key = normalizeEnumKey(this.sources[0]);
        return SOURCE_LABELS[key] || humanizeEnumValue(this.sources[0]) || 'Not specified';
    }

    /** @returns {string} Intl.DateTimeFormat formatted date */
    get formattedDate() {
        if (!this.date) return '';
        const d = new Date(this.date);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        }).format(d);
    }

    /** @returns {string} Plot summary like "PlotName - Location" */
    get plotSummaryLabel() {
        const name = this.plot?.name || 'Unnamed plot';
        const loc = this.plot?.location;
        return loc ? `${name} - ${loc}` : name;
    }

    /** @returns {string} Truncated description preview */
    get descriptionPreview() {
        if (!this.description) return 'No description';
        return this.description.length > 120
            ? this.description.substring(0, 120) + '...'
            : this.description;
    }
}
