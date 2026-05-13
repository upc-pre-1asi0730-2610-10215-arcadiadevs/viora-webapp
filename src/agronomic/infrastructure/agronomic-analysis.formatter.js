/**
 * @file agronomic-analysis.formatter.js
 * @description Infrastructure utility to provide PrimeVue Chart configurations with reactive hover support.
 */

export class AgronomicAnalysisFormatter {
    /**
     * Returns standard options for the dual-axis chart.
     * @param {Function} onHoverCallback - Function to execute when an element is hovered.
     * @returns {Object} Configuration options.
     */
    static getChartOptions(onHoverCallback) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event, elements) => {
                if (onHoverCallback && elements && elements.length > 0) {
                    onHoverCallback(elements[0]);
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: { family: 'Poppins', size: 12, weight: '500' },
                        color: '#1C1D21'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    padding: 12,
                    backgroundColor: 'rgba(28, 29, 33, 0.9)',
                    titleFont: { family: 'Poppins', size: 13, weight: '600' },
                    bodyFont: { family: 'Poppins', size: 12 },
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Poppins', size: 11 },
                        color: '#8C877F'
                    }
                },
                yNDVI: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 1.0,
                    title: {
                        display: true,
                        text: 'NDVI Index',
                        font: { family: 'Poppins', size: 12, weight: '600' },
                        color: '#2E4A3A'
                    },
                    grid: { color: '#F0F0F3' },
                    ticks: { color: '#8C877F' }
                },
                yCP: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Chill Portions (CP)',
                        font: { family: 'Poppins', size: 12, weight: '600' },
                        color: '#5B8DEF'
                    },
                    grid: { display: false },
                    ticks: { color: '#8C877F' }
                }
            }
        };
    }
}