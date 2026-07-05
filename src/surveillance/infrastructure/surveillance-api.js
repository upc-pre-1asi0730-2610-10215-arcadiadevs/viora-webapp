import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";

const alertsEndpointPath = import.meta.env.VITE_ALERTS_ENDPOINT_PATH || "/alerts";
const communityRiskEndpointPath = import.meta.env.VITE_COMMUNITY_RISK_ENDPOINT_PATH || "/community-risk";
const pestReportsEndpointPath = import.meta.env.VITE_PEST_REPORTS_ENDPOINT_PATH || "/pest-sighting-reports";
const symptomsEndpointPath = import.meta.env.VITE_SYMPTOMS_ENDPOINT_PATH || "/symptom-dictionary-items";

/**
 * Infrastructure service gateway for the Surveillance bounded-context endpoints.
 * @class SurveillanceApi
 * @extends BaseApi
 */
export class SurveillanceApi extends BaseApi {
    #alertsEndpoint;
    #communityRiskEndpoint;
    #pestReportsEndpoint;
    #symptomsEndpoint;

    constructor() {
        super();
        this.#alertsEndpoint = new BaseEndpoint(this, alertsEndpointPath);
        this.#communityRiskEndpoint = new BaseEndpoint(this, communityRiskEndpointPath);
        this.#pestReportsEndpoint = new BaseEndpoint(this, pestReportsEndpointPath);
        this.#symptomsEndpoint = new BaseEndpoint(this, symptomsEndpointPath);
    }

    getAlerts(params = {}) {
        const queryParams = { sort: "recent", limit: 50, ...params };
        return this.#alertsEndpoint.getAll(queryParams);
    }

    getAlertById(alertId) {
        return this.#alertsEndpoint.getById(alertId);
    }

    getAlertTimeline(alertId) {
        return this.http.get(`${this.#alertsEndpoint.endpointPath}/${alertId}`, { params: { view: "timeline" } });
    }

    updateAlertStatus(alertId, status, reason = null) {
        const body = { status };
        if (reason) body.reason = reason;
        return this.http.patch(`${this.#alertsEndpoint.endpointPath}/${alertId}`, body);
    }

    confirmAlert(alertId) {
        return this.markAlertUnderReview(alertId);
    }

    escalateAlert(alertId) {
        return this.http.patch(`${this.#alertsEndpoint.endpointPath}/${alertId}`, { raiseSeverity: true });
    }

    linkReport(alertId, reportId) {
        return this.http.put(`${this.#alertsEndpoint.endpointPath}/${alertId}/report/${reportId}`);
    }

    markAlertUnderReview(alertId) {
        return this.http.patch(`${this.#alertsEndpoint.endpointPath}/${alertId}`, { status: "UNDER_REVIEW" });
    }

    resolveAlert(alertId) {
        return this.http.patch(`${this.#alertsEndpoint.endpointPath}/${alertId}`, { status: "RESOLVED" });
    }

    dismissAlert(alertId) {
        return this.http.patch(`${this.#alertsEndpoint.endpointPath}/${alertId}`, { status: "DISMISSED" });
    }

    getCommunityRisk(plotId, radiusKm = 5) {
        return this.#communityRiskEndpoint.getAll({ plotId, radiusKm });
    }

    getPestReports() {
        return this.#pestReportsEndpoint.getAll();
    }

    createPestReport(request) {
        return this.#pestReportsEndpoint.create(request);
    }

    getSymptomDictionary() {
        return this.#symptomsEndpoint.getAll();
    }
}
