import { AgronomicRecord } from "./agronomic-record.entity.js";
import { ChillHourRecord } from "./chill-hour-record.entity.js";
import { YieldForecast } from "./yield-forecast.entity.js";
import { OverallPlotHealth } from "./overall-plot-health.entity.js";

/**
 * MonitoringSummary entity (Aggregate Root).
 * Composes all agronomic and surveillance KPIs into a single dashboard state.
 * @class MonitoringSummary
 */
export class MonitoringSummary {
    /**
     * Creates a new MonitoringSummary.
     * Hydrates nested domain objects to ensure rich logic is available in the UI.
     * @param {Object} params
     * @param {string} [params.period='current'] - Time window for the data (e.g., '7d', '30d').
     * @param {Object|null} [params.ndvi=null] - Latest NDVI telemetry.
     * @param {Object|null} [params.chillAccumulation=null] - Current CP accumulation.
     * @param {Object|null} [params.yieldForecast=null] - Harvest predictions.
     * @param {Object|null} [params.overallHealth=null] - Aggregated plot health status.
     * @param {string} [params.updatedAt=''] - Last synchronization timestamp.
     */
    constructor({
                    period = 'current',
                    ndvi = null,
                    chillAccumulation = null,
                    yieldForecast = null,
                    overallHealth = null,
                    updatedAt = ''
                }) {
        this.period = period;

        // Hydration of sub-entities/value objects
        this.latestNdvi = ndvi instanceof AgronomicRecord
            ? ndvi
            : new AgronomicRecord(ndvi || {});

        this.chillHourRecord = chillAccumulation instanceof ChillHourRecord
            ? chillAccumulation
            : new ChillHourRecord(chillAccumulation || {});

        this.yieldForecast = yieldForecast instanceof YieldForecast
            ? yieldForecast
            : new YieldForecast(yieldForecast || {});

        // Support for Image a8a2d5: Overall Plot Health
        this.overallPlotHealth = overallHealth instanceof OverallPlotHealth
            ? overallHealth
            : new OverallPlotHealth(overallHealth || {});

        this.updatedAt = updatedAt;
    }
}