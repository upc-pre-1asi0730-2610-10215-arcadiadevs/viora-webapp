import { Intervention } from '../domain/model/intervention-summary.entity.js';

/**
 * Backend resource shape for `GET /interventions`.
 * @typedef {Object} InterventionSummaryResource
 * @property {string|null} code
 * @property {number|null} interventionRequestId
 * @property {string|null} referenceCode
 * @property {number|null} plotId
 * @property {number|null} alertId
 * @property {number|null} specialistId
 * @property {number|null} serviceProposalId
 * @property {number|null} treatmentPrescriptionId
 * @property {number|null} interventionExecutionId
 * @property {number|null} interventionOutcomeId
 * @property {string|null} status
 * @property {string|null} serviceTitle
 * @property {number|null} amount
 * @property {string|null} currency
 */

const KNOWN_STATUSES = [
    'AWAITING_PRESCRIPTION',
    'PRESCRIPTION_ISSUED',
    'RECOVERY_MONITORING',
    'READY_TO_CLOSE',
    'CLOSED',
];

export class InterventionSummaryAssembler {
    /**
     * @param {InterventionSummaryResource} resource
     * @returns {Intervention}
     */
    static toEntityFromResource(resource) {
        const status = (resource.status ?? '').toUpperCase();
        return new Intervention({
            code: resource.code ?? '',
            interventionRequestId: resource.interventionRequestId ?? null,
            referenceCode: resource.referenceCode ?? '',
            plotId: resource.plotId ?? null,
            alertId: resource.alertId ?? null,
            specialistId: resource.specialistId ?? null,
            serviceProposalId: resource.serviceProposalId ?? null,
            treatmentPrescriptionId: resource.treatmentPrescriptionId ?? null,
            interventionExecutionId: resource.interventionExecutionId ?? null,
            interventionOutcomeId: resource.interventionOutcomeId ?? null,
            status: KNOWN_STATUSES.includes(status) ? status : 'AWAITING_PRESCRIPTION',
            serviceTitle: resource.serviceTitle ?? '',
            amount: resource.amount ?? null,
            currency: resource.currency ?? 'PEN',
        });
    }

    /**
     * @param {InterventionSummaryResource[]} resources
     * @returns {Intervention[]}
     */
    static toEntitiesFromResponse(resources) {
        return resources.map((resource) => InterventionSummaryAssembler.toEntityFromResource(resource));
    }
}
