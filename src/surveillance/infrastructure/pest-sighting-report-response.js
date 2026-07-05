/**
 * @typedef {Object} CreatePestSightingReportRequest
 * @property {number} plotId
 * @property {number} reporterUserId
 * @property {string} riskZone
 * @property {string[]} symptoms
 * @property {string} observedSeverity
 * @property {string} [notes]
 */

/**
 * @typedef {Object} PestSightingReportResource
 * @property {number} [id]
 * @property {number} [plotId]
 * @property {number} [reporterUserId]
 * @property {string} [riskZone]
 * @property {string[]} [symptoms]
 * @property {string} [observedSeverity]
 * @property {string} [notes]
 * @property {boolean} [evaluated]
 * @property {string} [calculatedRisk]
 * @property {string} [probableThreat]
 * @property {string} [status]
 * @property {boolean} [alertConfirmed]
 */
