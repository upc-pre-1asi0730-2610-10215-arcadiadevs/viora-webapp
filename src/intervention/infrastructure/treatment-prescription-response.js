/**
 * Backend resource for `GET /treatment-prescriptions/{id}`.
 * @typedef {Object} PrescribedProductResource
 * @property {string|null} productName
 * @property {number|null} dosageAmount
 * @property {string|null} dosageUnit
 * @property {number|null} sessionsCount
 * @property {string|null} technicalRecommendation
 */

/**
 * @typedef {Object} AgrochemicalPrescriptionResource
 * @property {string|null} applicationMethod
 * @property {number|null} sprayVolumeAmount
 * @property {string|null} sprayVolumeUnit
 * @property {number|null} preHarvestIntervalDays
 * @property {string|null} agronomistRecommendations
 * @property {string[]|null} requiredPPE
 * @property {PrescribedProductResource[]|null} products
 */

/**
 * @typedef {Object} TreatmentPrescriptionResource
 * @property {number|null} id
 * @property {number|null} serviceProposalId
 * @property {string|null} status
 * @property {AgrochemicalPrescriptionResource|null} agrochemicalPrescription
 */

/**
 * Read-only prescription view for the "Prescription summary" card.
 * @typedef {Object} PrescriptionView
 * @property {string} code
 * @property {string} treatment
 * @property {string[]} scope
 * @property {string[]} products
 */

export class TreatmentPrescriptionAssembler {
    /**
     * @param {TreatmentPrescriptionResource} resource
     * @returns {PrescriptionView}
     */
    static toView(resource) {
        const agro = resource.agrochemicalPrescription;
        const products = (agro?.products ?? [])
            .filter((product) => !!product.productName)
            .map((product) => {
                const dose =
                    product.dosageAmount != null ? ` \u00b7 ${product.dosageAmount} ${product.dosageUnit ?? ''}`.trimEnd() : '';
                return `${product.productName}${dose}`;
            });

        return {
            code: resource.id != null ? `RX-${String(resource.id).padStart(3, '0')}` : '\u2014',
            treatment: agro?.agronomistRecommendations || 'Targeted phytosanitary treatment for affected zones.',
            scope: [
                'Inspect and treat the affected zones',
                'Apply the recommended phytosanitary protocol',
                'Monitor recovery for 14 days',
            ],
            products,
        };
    }
}
