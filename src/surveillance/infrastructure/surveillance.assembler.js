import { Alert } from "../domain/model/alert.entity.js";

/**
 * SurveillanceAssembler class.
 * Responsible for mapping raw surveillance alert resources into Alert domain entities.
 * @class SurveillanceAssembler
 */
export class SurveillanceAssembler {
    /**
     * Maps a raw surveillance alert resource into an Alert entity instance.
     * @param {Object} resource - Raw alert data from the infrastructure layer.
     * @returns {Alert} A hydrated Alert entity.
     */
    static toEntityFromResource(resource) {
        const normalizedResource = resource ?? {};
        const plot = normalizedResource.plot ?? {};

        return new Alert({
            id: normalizedResource.id ?? null,
            reportId: normalizedResource.reportId ?? null,
            plotId: normalizedResource.plotId ?? null,
            type: normalizedResource.type || "",
            severity: normalizedResource.severity || "Low",
            status: normalizedResource.status || "Pending",
            title: normalizedResource.title || "",
            description: normalizedResource.description || "",
            date: normalizedResource.date || normalizedResource.createdAt || "",
            riskExplanation: normalizedResource.riskExplanation || "",
            sources: normalizedResource.sources || [],
            dataProviders: normalizedResource.dataProviders || [],
            supportingData: normalizedResource.supportingData || {},
            plot: {
                name: plot.name || normalizedResource.plotName || "",
                location: plot.location || normalizedResource.plotLocation || "",
                hectares:
                    plot.hectares ??
                    normalizedResource.plotHectares ??
                    normalizedResource.hectares ??
                    0,
            },
        });
    }

    /**
     * Parses a collection of alert resources from an Axios response.
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - Axios response.
     * @returns {Alert[]} Array of Alert domain entities.
     */
    static toEntitiesFromResponse(response) {
        if (!response || response.status !== 200 || response.data == null) {
            console.error(
                `[SurveillanceAssembler] Mapping error: Invalid response status ${response?.status}`,
            );
            return [];
        }

        const data = response.data;

        if (
            typeof data.status === "string" &&
            /^(error|fail|failed)$/i.test(data.status) &&
            !Array.isArray(data.alerts) &&
            !Array.isArray(data.results)
        ) {
            console.error(
                `[SurveillanceAssembler] Mapping error: ${response.status}, ${data.code || "ERROR"}, ${data.message || "Request failed"}`,
            );
            return [];
        }

        const resources = Array.isArray(data)
            ? data
            : Array.isArray(data.alerts)
                ? data.alerts
                : Array.isArray(data.results)
                    ? data.results
                    : [data];

        return resources.map((resource) => this.toEntityFromResource(resource));
    }
}
