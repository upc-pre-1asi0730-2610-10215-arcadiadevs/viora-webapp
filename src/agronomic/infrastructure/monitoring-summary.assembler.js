import { MonitoringSummary } from "../domain/model/monitoring-summary.entity.js";
import { AgronomicRecordAssembler } from "./agronomic-record.assembler.js";
import { ChillHourRecordAssembler } from "./chill-hour-record.assembler.js";
import { YieldForecastAssembler } from "./yield-forecast.assembler.js";
import { OverallHealthAssembler } from "./overall-plot-health.assembler.js";

/**
 * MonitoringSummaryAssembler class.
 * Responsible for orchestrating the assembly of a global monitoring summary
 * by delegating the hydration of nested components to their specialized assemblers.
 * * This approach preserves object identity and follows the Single Responsibility Principle.
 * * @class MonitoringSummaryAssembler
 */
export class MonitoringSummaryAssembler {
    /**
     * Maps a raw resource object into a MonitoringSummary entity.
     * * Instead of manual mapping, it uses specialized assemblers for NDVI,
     * Chill, and Yield sub-resources.
     * * @static
     * @param {Object} resource - Raw data from the /monitoring-summaries endpoint.
     * @returns {MonitoringSummary} Hydrated MonitoringSummary entity.
     */
    static toEntityFromResource(resource) {
        if (!resource) return null;

        if (resource.monitoringSummaryId || resource.ndviValue !== undefined) {
            const ndviEntity = AgronomicRecordAssembler.toEntityFromResource({
                date: resource.measurementDate,
                ndviIndex: resource.ndviValue,
                ndviTrend: "stable",
                ndviStatusLabel: resource.generalHealthStatus,
                temp: resource.weatherSnapshot?.temperatureCelsius
            });

            const chillEntity = ChillHourRecordAssembler.toEntityFromResource({
                accumulatedChillPortions: resource.accumulatedChillHours,
                weeklyDiff: 0,
                threshold: resource.chillRequirementPortions ?? 600,
                generatedAt: resource.measurementDate
            });

            const yieldEntity = YieldForecastAssembler.toEntityFromResource({
                tonnes: resource.yieldForecast,
                riskLevel: resource.climateRiskLevel,
                description: `Risk of alternate bearing: ${resource.climateRiskLevel ?? "Low"}`
            });

            const healthEntity = OverallHealthAssembler.toEntityFromResource({
                status: resource.generalHealthStatus,
                healthyPlotsCount: resource.healthyPlotsCount ?? 0,
                reviewPlotsCount: resource.reviewPlotsCount ?? 0
            });

            return new MonitoringSummary({
                period: "current",
                ndvi: ndviEntity,
                chillAccumulation: chillEntity,
                yieldForecast: yieldEntity,
                overallHealth: healthEntity,
                updatedAt: resource.measurementDate || new Date().toISOString()
            });
        }

        // Delegate specific assembly logic to child assemblers
        const ndviEntity = resource.ndvi
            ? AgronomicRecordAssembler.toEntityFromResource(resource.ndvi)
            : null;

        const chillEntity = resource.chillAccumulation
            ? ChillHourRecordAssembler.toEntityFromResource(resource.chillAccumulation)
            : null;

        const yieldEntity = resource.yieldForecast
            ? YieldForecastAssembler.toEntityFromResource(resource.yieldForecast)
            : null;

        const healthEntity = resource.overallHealth
            ? OverallHealthAssembler.toEntityFromResource(resource.overallHealth)
            : null;

        return new MonitoringSummary({
            period: resource.period || 'current',
            ndvi: ndviEntity,
            chillAccumulation: chillEntity,
            yieldForecast: yieldEntity,
            overallHealth: healthEntity,
            updatedAt: resource.generatedAt || resource.updatedAt || new Date().toISOString()
        });
    }

    /**
     * Processes an Axios HTTP response to extract and map the summary.
     * Logs errors and returns an empty/null state if the response is invalid.
     * * @static
     * @param {import('axios').AxiosResponse} response - Axios response object.
     * @returns {MonitoringSummary|null}
     */
    static toEntityFromResponse(response) {
        if (!response || response.status !== 200 || !response.data) {
            console.error(`[MonitoringSummaryAssembler] Failed to map response. Status: ${response?.status}`);
            return null;
        }

        /**
         * Summaries are usually delivered as single objects or single-item arrays.
         */
        const data = Array.isArray(response.data) ? response.data[0] : response.data;

        return data ? this.toEntityFromResource(data) : null;
    }
}
