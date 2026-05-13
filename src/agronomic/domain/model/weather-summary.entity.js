/**
 * WeatherSummary entity representing current local weather and forecast risks.
 * @class WeatherSummary
 */
export class WeatherSummary {
    /**
     * @param {Object} params
     * @param {string} [params.city=''] - City name.
     * @param {number} [params.currentTemp=0] - Current temperature.
     * @param {string} [params.condition=''] - Weather condition text (e.g., 'Sunny').
     * @param {number} [params.forecastTemp=0] - Expected forecast temperature.
     * @param {number} [params.temperatureAnomaly=0] - Degree variation from historical avg.
     * @param {string} [params.climateRisk='Low'] - Categorized risk level.
     * @param {string} [params.lastUpdate=''] - Formatted last update time.
     */
    constructor({
                    city = '',
                    currentTemp = 0,
                    condition = '',
                    forecastTemp = 0,
                    temperatureAnomaly = 0,
                    climateRisk = 'Low',
                    lastUpdate = ''
                }) {
        this.city = city;
        this.currentTemp = currentTemp;
        this.condition = condition;
        this.forecastTemp = forecastTemp;
        this.temperatureAnomaly = temperatureAnomaly;
        this.climateRisk = climateRisk;
        this.lastUpdate = lastUpdate;
    }

    /**
     * Formats the temperature anomaly for UI display.
     * @returns {string} E.g., "+2.5°C" or "-1.2°C".
     */
    get anomalyLabel() {
        const sign = this.temperatureAnomaly > 0 ? '+' : '-';
        return `${sign}${this.temperatureAnomaly.toFixed(1)}°C`;
    }

    /**
     * Checks if there is a significant thermal risk (Anomaly > 5°C).
     * @returns {boolean}
     */
    get isHighThermalRisk() {
        return Math.abs(this.temperatureAnomaly) > 5;
    }
}