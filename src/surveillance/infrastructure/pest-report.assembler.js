import { PestReport } from "../domain/model/pest-report.entity.js";

const normalizeRiskZone = (value) => {
    switch (String(value || '').trim().toUpperCase()) {
        case 'EDGES':
            return 'EDGES';
        case 'PARTIAL_PLOT':
            return 'PARTIAL_PLOT';
        default:
            return 'FULL_PLOT';
    }
};

const normalizeSeverity = (value) => {
    switch (String(value || '').trim().toUpperCase()) {
        case 'CRITICAL':
            return 'Critical';
        case 'HIGH':
            return 'High';
        case 'MEDIUM':
            return 'Medium';
        default:
            return 'Low';
    }
};

/**
 * PestReportAssembler class.
 * Maps raw pest report resources into PestReport domain entities.
 * @class PestReportAssembler
 */
export class PestReportAssembler {
    /**
     * Maps a raw pest report resource into a PestReport entity instance.
     * @param {Object} resource - Raw pest report data from the infrastructure layer.
     * @returns {PestReport}
     */
    static toEntityFromResource(resource) {
        const r = resource ?? {};
        return new PestReport({
            id: r.id ?? null,
            code: r.code || '',
            plotId: r.plotId ?? null,
            plotName: r.plotName || '',
            riskZone: normalizeRiskZone(r.riskZone),
            symptoms: r.symptoms || [],
            observedSeverity: normalizeSeverity(r.observedSeverity),
            notes: r.notes || r.description || '',
            evaluated: r.evaluated ?? false,
            calculatedRisk: r.calculatedRisk || '',
            probableThreat: r.probableThreat || '',
            status: r.status || '',
            alertConfirmed: r.alertConfirmed ?? false,
            date: r.date || r.createdAt || '',
            reportedBy: r.reportedBy || ''
        });
    }

    /**
     * Parses a collection of pest report resources from an Axios response.
     * @param {import('axios').AxiosResponse} response
     * @returns {PestReport[]}
     */
    static toEntitiesFromResponse(response) {
        if (!response || response.status !== 200 || response.data == null) {
            console.error(
                '[PestReportAssembler] Mapping error: Invalid response status ' + response?.status,
            );
            return [];
        }

        const data = response.data;

        if (
            typeof data.status === "string" &&
            /^(error|fail|failed)$/i.test(data.status) &&
            !Array.isArray(data.reports) &&
            !Array.isArray(data.results)
        ) {
            console.error(
                '[PestReportAssembler] Mapping error: ' + response.status + ', ' + (data.code || "ERROR") + ', ' + (data.message || "Request failed"),
            );
            return [];
        }

        const resources = Array.isArray(data)
            ? data
            : Array.isArray(data.reports)
                ? data.reports
                : Array.isArray(data.results)
                    ? data.results
                    : [data];

        return resources.map(r => this.toEntityFromResource(r));
    }
}
