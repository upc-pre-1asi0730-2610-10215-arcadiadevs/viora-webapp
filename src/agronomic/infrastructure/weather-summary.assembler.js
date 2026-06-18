import { WeatherSummary } from "../domain/model/weather-summary.entity.js";

const BACKGROUND_ROOT = "/assets/icons/backgrounds";

// High-resolution hero illustration used for every condition, mirroring the OS
// frontend (the condition only drives the background gradient image). The
// per-condition `icons/weather/*` assets are low-resolution and distort when
// scaled, so they are intentionally not used for the hero.
const HERO_ICON = "/assets/icons/dashboard/weather-cloud.png";

/**
 * Resolves the hero background image asset from a weather condition, mirroring
 * the OS frontend mapping. Accepts both human labels ("Partly cloudy") and
 * platform enums ("PARTLY_CLOUDY").
 *
 * @param {string} condition - Raw weather condition or status.
 * @returns {{icon: string, backgroundImage: string}}
 */
const resolveWeatherVisual = (condition = "") => {
    const value = String(condition).replace(/_/g, " ").trim().toLowerCase();
    let backgroundImage;

    if (value.includes("thunder") || value.includes("storm")) {
        backgroundImage = `${BACKGROUND_ROOT}/Thunderstorm.png`;
    } else if (value.includes("rain") || value.includes("drizzle") || value.includes("shower") || value.includes("snow")) {
        backgroundImage = `${BACKGROUND_ROOT}/rain.png`;
    } else if (value.includes("breezy") || value.includes("wind") || value.includes("sand") || value.includes("dust")) {
        backgroundImage = `${BACKGROUND_ROOT}/breezy.png`;
    } else if (value.includes("clear") || value.includes("sunny") || value.includes("sun")) {
        backgroundImage = `${BACKGROUND_ROOT}/clear.png`;
    } else {
        backgroundImage = `${BACKGROUND_ROOT}/party-cloudy.png`;
    }

    return { icon: HERO_ICON, backgroundImage };
};

/**
 * Converts a weather status (label or enum) into a human-readable condition.
 *
 * @param {string} condition - Raw weather condition or status.
 * @returns {string}
 */
const humanizeCondition = (condition = "") => {
    const value = String(condition).replace(/_/g, " ").trim().toLowerCase();
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Maps weather resources into WeatherSummary domain entities.
 * * @class WeatherSummaryAssembler
 */
export class WeatherSummaryAssembler {
    /**
     * @param {Object} resource - Raw weather summary data.
     * @returns {WeatherSummary} WeatherSummary entity.
     */
    static toEntityFromResource(resource) {
        if (resource?.daily || resource?.hourly) {
            const firstHour = resource.hourly?.[0] ?? {};
            const firstDay = resource.daily?.[0] ?? {};
            const rawCondition = firstHour.weatherStatus ?? firstDay.dominantStatus ?? "";
            const visual = resolveWeatherVisual(rawCondition);

            return new WeatherSummary({
                id: resource.plotId ?? null,
                city: resource.plotName ?? "Tacna",
                currentTemp: firstHour.temperatureCelsius ?? firstDay.averageTemperatureCelsius ?? 0,
                condition: humanizeCondition(rawCondition),
                lastUpdate: resource.generatedAt ?? "",
                icon: resource.icon ?? visual.icon,
                backgroundImage: resource.backgroundImage ?? visual.backgroundImage,
                forecast3Days: (resource.daily ?? []).slice(0, 3).map((day, index) => ({
                    dayLabel: index === 0 ? "Today" : day.date ?? "",
                    minTemp: day.minTemperatureCelsius ?? 0,
                    maxTemp: day.maxTemperatureCelsius ?? 0,
                    condition: humanizeCondition(day.dominantStatus ?? "")
                })),
                temperatureAnomaly: resource.thermalAnomalyCelsius ?? 0,
                climateRisk: humanizeCondition(resource.overallRisk ?? "Low")
            });
        }

        const visual = resolveWeatherVisual(resource?.condition ?? "");

        return new WeatherSummary({
            id: resource?.id ?? null,
            city: resource?.city ?? '',
            currentTemp: resource?.currentTemp ?? 0,
            condition: resource?.condition ?? '',
            lastUpdate: resource?.lastUpdate ?? '',
            icon: resource?.icon || visual.icon,
            backgroundImage: resource?.backgroundImage || visual.backgroundImage,
            forecast3Days: (resource?.forecast3Days ?? []).map(day => ({
                dayLabel: day.dayLabel ?? '',
                minTemp: day.minTemp ?? 0,
                maxTemp: day.maxTemp ?? 0,
                condition: day.condition ?? ''
            })),
            temperatureAnomaly: resource?.temperatureAnomaly ?? 0,
            climateRisk: resource?.climateRisk ?? 'Low'
        });
    }

    /**
     * Parses weather resources from a response.
     * * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {WeatherSummary[]} List of entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`Mapping error: ${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : [response.data];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
