/**
 * Body for `POST /intervention-executions` (certify field application).
 * @typedef {Object} CertifyApplicationRequest
 * @property {number} treatmentPrescriptionId
 * @property {string} applicationDate
 * @property {string} appliedArea
 * @property {'APPLIED_AS_PRESCRIBED'|'PARTIALLY_APPLIED'|'NOT_APPLIED'} executionStatus
 * @property {string} [fieldNote]
 */

/**
 * Body for `POST /intervention-outcomes` (report impact after the grace period).
 * @typedef {Object} ReportImpactRequest
 * @property {number} interventionExecutionId
 * @property {string} gracePeriod
 * @property {'PEST_PRESSURE_REDUCED'|'SYMPTOMS_PERSIST'|'NEW_SYMPTOMS_DETECTED'|'NOT_ENOUGH_EVIDENCE_YET'} observedResult
 * @property {'POSITIVE'|'PARTIAL'|'NEGATIVE'|'INCONCLUSIVE'} impactLevel
 * @property {string} producerAssessment
 */

/**
 * Body for `PATCH /intervention-outcomes/{id}/evaluation` (close + rate).
 * @typedef {Object} CloseInterventionRequest
 * @property {'RESOLVED'|'PARTIALLY_RESOLVED'|'NOT_RESOLVED'} serviceResult
 * @property {'YES'|'NO'} hireAgain
 * @property {string} [privateFeedback]
 */
