import { NearbyRiskSignal, CommunityRiskSnapshot } from "../domain/model/nearby-risk-signal.entity.js";

/**
 * CommunityRiskAssembler class.
 * Maps raw community risk resources into domain entities.
 * @class CommunityRiskAssembler
 */
export class CommunityRiskAssembler {
    /**
     * @param {Object} resource
     * @returns {NearbyRiskSignal}
     */
    static #toSignal(resource) {
        const r = resource ?? {};
        return new NearbyRiskSignal({
            id: r.id ?? null,
            title: r.title || '',
            distanceKm: r.distanceKm ?? 0,
            severity: r.severity || 'Low',
            probableThreat: r.probableThreat || ''
        });
    }

    /**
     * Maps a raw community risk resource into a CommunityRiskSnapshot entity.
     * @param {Object} resource - Raw data from the infrastructure layer.
     * @returns {CommunityRiskSnapshot}
     */
    static toEntityFromResource(resource) {
        const r = resource ?? {};
        return new CommunityRiskSnapshot({
            plotName: r.plotName || '',
            radiusKm: r.radiusKm ?? 0,
            signals: (r.signals || []).map(s => this.#toSignal(s)),
            preventiveRecommendations: r.preventiveRecommendations || []
        });
    }

    /**
     * Parses community risk data from an Axios response.
     * @param {import('axios').AxiosResponse} response
     * @returns {CommunityRiskSnapshot[]}
     */
    static toEntitiesFromResponse(response) {
        if (!response || response.status !== 200 || response.data == null) {
            console.error(
                `[CommunityRiskAssembler] Mapping error: Invalid response status ${response?.status}`,
            );
            return [];
        }

        const data = response.data;

        if (
            typeof data.status === "string" &&
            /^(error|fail|failed)$/i.test(data.status) &&
            !Array.isArray(data.signals) &&
            !Array.isArray(data.results)
        ) {
            console.error(
                `[CommunityRiskAssembler] Mapping error: ${response.status}, ${data.code || "ERROR"}, ${data.message || "Request failed"}`,
            );
            return [];
        }

        const resources = Array.isArray(data)
            ? data
            : Array.isArray(data.signals)
                ? [data]
                : Array.isArray(data.results)
                    ? data.results
                    : [data];

        return resources.map(r => this.toEntityFromResource(r));
    }
}
