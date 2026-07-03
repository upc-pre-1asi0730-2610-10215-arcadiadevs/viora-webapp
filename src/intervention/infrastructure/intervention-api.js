import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

import { SpecialistCandidateAssembler } from './specialist-candidate-response.js';
import { InterventionRequestAssembler } from './intervention-request-response.js';
import { ServiceProposalAssembler } from './service-proposal-response.js';
import { SpecialistContactAssembler } from './specialist-contact-response.js';
import { InterventionSummaryAssembler } from './intervention-summary-response.js';
import { TreatmentPrescriptionAssembler } from './treatment-prescription-response.js';

const defaultUserId = import.meta.env.VITE_DEFAULT_USER_ID;

const interventionRequestsPath = import.meta.env.VITE_INTERVENTION_REQUESTS_ENDPOINT_PATH || '/intervention-requests';
const specialistCandidatesPath = import.meta.env.VITE_SPECIALIST_CANDIDATES_ENDPOINT_PATH || '/specialist-candidates';
const serviceProposalsPath = import.meta.env.VITE_SERVICE_PROPOSALS_ENDPOINT_PATH || '/service-proposals';
const specialistsPath = import.meta.env.VITE_SPECIALISTS_ENDPOINT_PATH || '/specialists';
const interventionsPath = import.meta.env.VITE_INTERVENTIONS_ENDPOINT_PATH || '/interventions';
const prescriptionsPath = import.meta.env.VITE_TREATMENT_PRESCRIPTIONS_ENDPOINT_PATH || '/treatment-prescriptions';
const executionsPath = import.meta.env.VITE_INTERVENTION_EXECUTIONS_ENDPOINT_PATH || '/intervention-executions';
const outcomesPath = import.meta.env.VITE_INTERVENTION_OUTCOMES_ENDPOINT_PATH || '/intervention-outcomes';

/**
 * Infrastructure gateway for the Intervention bounded context (Expert Assistance).
 * @class InterventionApi
 * @extends BaseApi
 */
export class InterventionApi extends BaseApi {
    #requests;
    #candidates;
    #proposals;
    #specialists;
    #interventions;
    #prescriptions;
    #executions;
    #outcomes;

    constructor() {
        super();
        this.#requests = new BaseEndpoint(this, interventionRequestsPath);
        this.#candidates = new BaseEndpoint(this, specialistCandidatesPath);
        this.#proposals = new BaseEndpoint(this, serviceProposalsPath);
        this.#specialists = new BaseEndpoint(this, specialistsPath);
        this.#interventions = new BaseEndpoint(this, interventionsPath);
        this.#prescriptions = new BaseEndpoint(this, prescriptionsPath);
        this.#executions = new BaseEndpoint(this, executionsPath);
        this.#outcomes = new BaseEndpoint(this, outcomesPath);
    }

    /**
     * Fetches ranked specialist candidates for an alert.
     * @param {number|string} alertId
     * @param {number} [limit=3]
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getSpecialistCandidates(alertId, limit = 3) {
        return this.#candidates.getAll({ alertId, limit });
    }

    /**
     * Lists the active producer's intervention requests for a single plot.
     * @param {number|string} plotId
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getRequestsByPlot(plotId) {
        return this.#requests.getAll({ growerId: Number(defaultUserId) || 1, plotId });
    }

    /**
     * Lists all of the active producer's intervention requests (all plots).
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getAllRequests() {
        return this.#requests.getAll({ growerId: Number(defaultUserId) || 1 });
    }

    /**
     * Declines an intervention request.
     * @param {number|string} id
     * @param {string} reason
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    declineRequest(id, reason) {
        return this.http.patch(`${this.#requests.endpointPath}/${id}`, { reason });
    }

    /**
     * Sends a formal intervention request to a specialist.
     * @param {Object} request
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createRequest(request) {
        const body = {
            growerId: Number(defaultUserId) || 1,
            ...request,
        };
        return this.#requests.create(body);
    }

    /**
     * Lists the service proposals submitted for an intervention request.
     * @param {number|string} requestId
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getProposalsByRequest(requestId) {
        return this.#proposals.getAll({ requestId });
    }

    /**
     * Accepts or rejects a service proposal.
     * @param {number|string} id
     * @param {'ACCEPTED'|'REJECTED'} status
     * @param {string} [reason]
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    updateProposalStatus(id, status, reason) {
        const body = { status };
        if (reason) body.reason = reason;
        return this.#proposals.update(id, body);
    }

    /**
     * Fetches a specialist's private contact details.
     * @param {number|string} specialistId
     * @param {number|string} requestId
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getSpecialistContact(specialistId, requestId) {
        return this.http.get(`${this.#specialists.endpointPath}/${specialistId}/contact`, {
            params: { userId: Number(defaultUserId) || 1, requestId },
        });
    }

    /**
     * Simulates the specialist responding to a request.
     * @param {number|string} requestId
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    simulateSpecialistResponse(requestId) {
        return this.http.post(`${this.#requests.endpointPath}/${requestId}/simulate-specialist-response`, {});
    }

    /**
     * Lists the active producer's interventions with lifecycle status.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getInterventions() {
        return this.#interventions.getAll({ growerId: Number(defaultUserId) || 1 });
    }

    /**
     * Simulates the specialist issuing a technical prescription.
     * @param {number|string} requestId
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    simulatePrescription(requestId) {
        return this.http.post(`${this.#interventions.endpointPath}/${requestId}/simulate-prescription`, {});
    }

    /**
     * Fetches the technical prescription for the "Prescription summary" card.
     * @param {number|string} prescriptionId
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getPrescription(prescriptionId) {
        return this.http.get(`${this.#prescriptions.endpointPath}/${prescriptionId}`);
    }

    /**
     * Fetches a specialist's public profile (name/role) for display.
     * @param {number|string} id
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getSpecialistProfile(id) {
        return this.http.get(`${this.#specialists.endpointPath}/${id}`);
    }

    /**
     * Certifies the field application of a prescription (producer).
     * @param {Object} request
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    certifyApplication(request) {
        return this.#executions.create(request);
    }

    /**
     * Reports the intervention impact after the grace period (producer).
     * @param {Object} request
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    reportImpact(request) {
        return this.#outcomes.create(request);
    }

    /**
     * Closes the intervention with the service evaluation (producer).
     * @param {number|string} outcomeId
     * @param {Object} request
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    closeIntervention(outcomeId, request) {
        return this.http.patch(`${this.#outcomes.endpointPath}/${outcomeId}/evaluation`, request);
    }
}
