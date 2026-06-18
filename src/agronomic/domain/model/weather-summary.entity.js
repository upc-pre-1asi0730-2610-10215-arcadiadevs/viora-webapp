/**
 * WeatherSummary entity representing current local weather and forecast risks.
 * @class WeatherSummary
 */
export class WeatherSummary {
    /**
     * @param {Object} params
     * @param {number|null} [params.id=null] - Resource identifier.
     * @param {string} [params.city=''] - City name.
     * @param {number} [params.currentTemp=0] - Current temperature.
     * @param {string} [params.condition=''] - Weather condition text (e.g., 'Sunny').
     * @param {string} [params.lastUpdate=''] - ISO timestamp of the last update.
     * @param {string} [params.icon=''] - Path to the weather condition icon.
     * @param {string} [params.backgroundImage=''] - Path to the hero background image.
     * @param {Array<{dayLabel: string, minTemp: number, maxTemp: number, condition: string}>} [params.forecast3Days=[]] - 3-day forecast entries.
     * @param {number} [params.temperatureAnomaly=0] - Degree variation from historical avg.
     * @param {string} [params.climateRisk='Low'] - Categorized risk level.
     */
    constructor({
                    id = null,
                    city = '',
                    currentTemp = 0,
                    condition = '',
                    lastUpdate = '',
                    icon = '',
                    backgroundImage = '',
                    forecast3Days = [],
                    temperatureAnomaly = 0,
                    climateRisk = 'Low'
                }) {
        this.id = id;
        this.city = city;
        this.currentTemp = currentTemp;
        this.condition = condition;
        this.lastUpdate = lastUpdate;
        this.icon = icon;
        this.backgroundImage = backgroundImage;
        this.forecast3Days = forecast3Days;
        this.temperatureAnomaly = temperatureAnomaly;
        this.climateRisk = climateRisk;
    }

    /**
     * Formats the temperature anomaly for UI display.
     * @returns {string} E.g., "+2.5°C" or "-1.2°C".
     */
    get anomalyLabel() {
        const sign = this.temperatureAnomaly > 0 ? '+' : '-';
        return `${sign}${Math.abs(this.temperatureAnomaly).toFixed(1)}°C`;
    }

    /**
     * Checks if there is a significant thermal risk (Anomaly > 5°C).
     * @returns {boolean}
     */
    get isHighThermalRisk() {
        return Math.abs(this.temperatureAnomaly) > 5;
    }
}