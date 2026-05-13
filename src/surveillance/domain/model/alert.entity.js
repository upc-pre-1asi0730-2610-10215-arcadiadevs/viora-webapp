/**
 * Alert entity representing a critical surveillance event in the field.
 * This entity belongs to the Surveillance Bounded Context.
 * It uses a simplified Plot information (Value Object) to maintain context isolation.
 * @class Alert
 */
export class Alert {
    /**
     * @param {Object} params
     * @param {number|null} [params.id=null] - Unique identifier.
     * @param {string} [params.type=''] - Type of the alert (e.g., 'Phenological risk', 'Pest symptom report', 'Low NDVI zone').
     * @param {string} [params.description=''] - Brief description of the alert context.
     * @param {string} [params.severity='Low'] - Categorized severity ('Low', 'Medium', 'High').
     * @param {string} [params.date=''] - Timestamp or formatted date of the alert.
     * @param {string} [params.status='Pending'] - Current state ('Pending', 'In Progress', 'Resolved').
     * @param {Object} [params.plot={}] - Simplified plot info.
     * @param {string} [params.plot.name=''] - Name of the affected plot.
     * @param {string} [params.plot.location=''] - Geographical reference/location.
     * @param {number} [params.plot.hectares=0] - Area size in hectares.
     */
    constructor({
                    id = null,
                    type = '',
                    description = '',
                    severity = 'Low',
                    date = '',
                    status = 'Pending',
                    plot = {
                        name: '',
                        location: '',
                        hectares: 0
                    }
                }) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.severity = severity;
        this.date = date;
        this.status = status;
        this.plot = plot;
    }

    /**
     * Business logic to check if the alert requires immediate action.
     * @returns {boolean}
     */
    get requiresUrgentAction() {
        return this.severity === 'High' && this.status === 'Pending';
    }
}
