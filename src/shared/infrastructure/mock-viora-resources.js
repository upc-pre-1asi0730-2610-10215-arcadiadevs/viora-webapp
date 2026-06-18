const now = new Date();
const isoHoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

const plots = [
    {
        id: 1,
        userId: 1,
        name: "Santa Rosa",
        location: "La Yarada, Tacna",
        cropType: "Olive",
        variety: "Sevillana",
        campaign: "2026 campaign",
        polygonCoordinates: [
            [-70.2912, -18.0834],
            [-70.2868, -18.0831],
            [-70.2865, -18.0872],
            [-70.2914, -18.0875],
            [-70.2912, -18.0834]
        ],
        areaSize: 18.4,
        areaSizeHectares: 18.4,
        currentNdvi: 0.71,
        chillPortions: 482,
        healthStatus: "Healthy",
        phenologicalRisk: "Low",
        onlineDeviceCount: 3,
        activeAlertCount: 1,
        lastUpdate: isoHoursAgo(1),
        lastUpdatedAt: isoHoursAgo(1),
        climateMonitoring: "Active",
        satelliteNdvi: "Active"
    },
    {
        id: 2,
        userId: 1,
        name: "Los Olivos",
        location: "Los Palos, Tacna",
        cropType: "Olive",
        variety: "Criolla",
        campaign: "2026 campaign",
        polygonCoordinates: [
            [-70.3038, -18.0711],
            [-70.2995, -18.0708],
            [-70.2992, -18.0746],
            [-70.3041, -18.0749],
            [-70.3038, -18.0711]
        ],
        areaSize: 12.8,
        areaSizeHectares: 12.8,
        currentNdvi: 0.64,
        chillPortions: 455,
        healthStatus: "Under Review",
        phenologicalRisk: "Medium",
        onlineDeviceCount: 2,
        activeAlertCount: 2,
        lastUpdate: isoHoursAgo(3),
        lastUpdatedAt: isoHoursAgo(3),
        climateMonitoring: "Active",
        satelliteNdvi: "Active"
    },
    {
        id: 3,
        userId: 1,
        name: "El Mirador",
        location: "Sama, Tacna",
        cropType: "Olive",
        variety: "Ascolana",
        campaign: "2026 campaign",
        polygonCoordinates: [
            [-70.2183, -17.9852],
            [-70.2147, -17.9848],
            [-70.2142, -17.9881],
            [-70.2186, -17.9884],
            [-70.2183, -17.9852]
        ],
        areaSize: 9.6,
        areaSizeHectares: 9.6,
        currentNdvi: 0.58,
        chillPortions: 431,
        healthStatus: "Healthy",
        phenologicalRisk: "Medium",
        onlineDeviceCount: 1,
        activeAlertCount: 0,
        lastUpdate: isoHoursAgo(5),
        lastUpdatedAt: isoHoursAgo(5),
        climateMonitoring: "Active",
        satelliteNdvi: "Active"
    }
];

const monitoringSummary = {
    period: "current",
    generatedAt: isoHoursAgo(1),
    ndvi: {
        date: isoHoursAgo(1),
        ndviIndex: 0.68,
        ndviTrend: "up",
        ndviStatusLabel: "Stable vegetation vigor",
        temp: 21,
        cp: 482,
        yieldValue: 24.6
    },
    chillAccumulation: {
        id: 1,
        plotId: 1,
        accumulatedChillPortions: 482,
        weeklyDiff: 18,
        threshold: 600,
        generatedAt: isoHoursAgo(1)
    },
    yieldForecast: {
        tonnes: 24.6,
        riskLevel: "Low",
        description: "Risk of alternate bearing: Low"
    },
    overallHealth: {
        status: "Stable",
        healthyPlotsCount: 2,
        reviewPlotsCount: 1
    }
};

const agronomicRecords = [
    { date: "Jun 12", plotId: 1, ndviIndex: 0.61, ndviTrend: "up", ndviStatusLabel: "Recovering", temp: 19, cp: 420, yieldValue: 21.1 },
    { date: "Jun 13", plotId: 1, ndviIndex: 0.63, ndviTrend: "up", ndviStatusLabel: "Stable", temp: 20, cp: 432, yieldValue: 22.4 },
    { date: "Jun 14", plotId: 1, ndviIndex: 0.65, ndviTrend: "up", ndviStatusLabel: "Stable", temp: 21, cp: 448, yieldValue: 23.1 },
    { date: "Jun 15", plotId: 1, ndviIndex: 0.67, ndviTrend: "up", ndviStatusLabel: "Stable", temp: 20, cp: 461, yieldValue: 23.8 },
    { date: "Jun 16", plotId: 1, ndviIndex: 0.68, ndviTrend: "up", ndviStatusLabel: "Healthy", temp: 21, cp: 482, yieldValue: 24.6 }
];

const agronomicStatistics = [
    {
        id: 1,
        plotId: "all",
        timeRange: "30days",
        labels: ["May 20", "May 27", "Jun 03", "Jun 10", "Jun 17"],
        ndviSeries: [0.58, 0.61, 0.63, 0.66, 0.68],
        cpSeries: [352, 386, 421, 455, 482],
        threshold: 600,
        observation: "Vegetation vigor remains stable while chill accumulation approaches campaign target.",
        trend: "Up",
        statusLabel: "Stable",
        description: "NDVI and chill portions are moving in the expected range for monitored olive plots."
    }
];

const weatherSummaries = [
    {
        id: 1,
        city: "Tacna",
        currentTemp: 21,
        condition: "Partly cloudy",
        lastUpdate: isoHoursAgo(1),
        icon: "/assets/icons/weather/sun_cloudy.png",
        backgroundImage: "/assets/icons/backgrounds/backgorund-party-cloudy.png",
        forecast3Days: [
            { dayLabel: "Today", minTemp: 14, maxTemp: 22, condition: "Partly cloudy" },
            { dayLabel: "Fri", minTemp: 13, maxTemp: 21, condition: "Light rain" },
            { dayLabel: "Sat", minTemp: 12, maxTemp: 20, condition: "Breezy" }
        ],
        temperatureAnomaly: 1.4,
        climateRisk: "Low"
    }
];

const yieldForecasts = [
    {
        id: 1,
        plotId: 1,
        tonnes: 24.6,
        riskLevel: "Low",
        description: "Risk of alternate bearing: Low"
    }
];

const iotDevices = [
    { id: 1, name: "Soil Sensor Alpha", plotId: 1, soilMoisture: 42, temperature: 20.8, leafHumidity: 64, status: "active", lastUpdate: isoHoursAgo(1) },
    { id: 2, name: "Canopy Sensor Beta", plotId: 1, soilMoisture: 39, temperature: 21.4, leafHumidity: 59, status: "warning", lastUpdate: isoHoursAgo(2) },
    { id: 3, name: "Irrigation Node Norte", plotId: 2, soilMoisture: 34, temperature: 22.1, leafHumidity: 57, status: "active", lastUpdate: isoHoursAgo(3) },
    { id: 4, name: "Climate Node Sur", plotId: 3, soilMoisture: 46, temperature: 19.9, leafHumidity: 68, status: "active", lastUpdate: isoHoursAgo(5) }
];

const iotDeviceSummary = {
    id: 1,
    totalOnlineDevices: 4,
    plotsWithIot: 3,
    lastSync: isoHoursAgo(1),
    sensorCards: [
        {
            id: "soil-moisture",
            plotId: 1,
            title: "Soil moisture",
            sourceLabel: "IoT",
            metricLabel: "Soil moisture",
            metricValue: 42,
            metricUnit: "%",
            trend: "stable",
            riskLevel: "Low",
            recommendation: "Moisture conditions are stable."
        },
        {
            id: "soil-temperature",
            plotId: 1,
            title: "Soil temperature",
            sourceLabel: "IoT",
            metricLabel: "Soil temperature",
            metricValue: 20.8,
            metricUnit: "C",
            trend: "up",
            riskLevel: "Medium",
            recommendation: "Watch temperature exposure."
        },
        {
            id: "water-stress",
            plotId: 2,
            title: "Water Stress",
            sourceLabel: "IoT",
            metricLabel: "Stress index",
            metricValue: 36,
            metricUnit: "%",
            trend: "down",
            riskLevel: "Medium",
            recommendation: "Monitor soil moisture trend."
        }
    ]
};

const alerts = [
    {
        id: 1,
        type: "Phenological risk",
        description: "Chill accumulation is below the recommended campaign curve.",
        severity: "Medium",
        date: isoHoursAgo(4),
        status: "Pending",
        plot: { name: "Los Olivos", location: "Los Palos, Tacna", hectares: 12.8 }
    },
    {
        id: 2,
        type: "Low NDVI zone",
        description: "Satellite telemetry detected a lower vigor area near the south boundary.",
        severity: "High",
        date: isoHoursAgo(7),
        status: "In Progress",
        plot: { name: "Santa Rosa", location: "La Yarada, Tacna", hectares: 18.4 }
    },
    {
        id: 3,
        type: "Irrigation attention",
        description: "Soil moisture trend is decreasing faster than expected.",
        severity: "Medium",
        date: isoHoursAgo(12),
        status: "Pending",
        plot: { name: "Los Olivos", location: "Los Palos, Tacna", hectares: 12.8 }
    }
];

const normalizeStatus = (status = "ACTIVE") => String(status)
    .replace(/[\s-]+/g, "_")
    .toUpperCase();

const normalizeTimeRange = (timeRange = "LAST_30_DAYS") => {
    const ranges = {
        current: "LAST_30_DAYS",
        "7days": "LAST_7_DAYS",
        "30days": "LAST_30_DAYS",
        campaign: "CAMPAIGN"
    };
    return ranges[timeRange] || String(timeRange || "LAST_30_DAYS").toUpperCase();
};

const dateDaysFromNow = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

const weatherStatus = (condition = "") => String(condition)
    .replace(/[\s-]+/g, "_")
    .toUpperCase();

const toBackendPlot = (plot) => ({
    id: plot.id,
    userId: plot.userId,
    name: plot.name,
    polygonCoordinates: plot.polygonCoordinates,
    areaSize: plot.areaSize,
    areaSizeHectares: plot.areaSizeHectares,
    lastUpdate: plot.lastUpdate,
    cropType: plot.cropType,
    variety: plot.variety,
    location: plot.location,
    campaign: plot.campaign,
    notes: plot.notes ?? "Local design data aligned to the platform contract.",
    state: plot.state ?? "ACTIVE",
    healthStatus: plot.healthStatus,
    phenologicalRisk: plot.phenologicalRisk,
    currentImagery: plot.currentImagery ?? {
        plotId: plot.id,
        ndviAverage: plot.currentNdvi,
        capturedAt: plot.lastUpdatedAt,
        tileUrlTemplate: `/api/v1/plots/${plot.id}/imagery/tile/{z}/{x}/{y}`
    },
    currentNdvi: plot.currentNdvi,
    chillPortions: plot.chillPortions,
    onlineDeviceCount: plot.onlineDeviceCount,
    activeAlertCount: plot.activeAlertCount,
    lastUpdatedAt: plot.lastUpdatedAt,
    climateMonitoring: plot.climateMonitoring,
    satelliteNdvi: plot.satelliteNdvi
});

const toCurrentMonitoringSummaryResource = () => ({
    monitoringSummaryId: 1,
    userId: 1,
    generalHealthStatus: monitoringSummary.overallHealth.status,
    ndviValue: monitoringSummary.ndvi.ndviIndex,
    accumulatedChillHours: monitoringSummary.chillAccumulation.accumulatedChillPortions,
    yieldForecast: monitoringSummary.yieldForecast.tonnes,
    measurementDate: monitoringSummary.generatedAt,
    weatherSnapshot: {
        location: weatherSummaries[0].city,
        temperatureCelsius: weatherSummaries[0].currentTemp,
        condition: weatherSummaries[0].condition
    },
    climateRiskLevel: monitoringSummary.yieldForecast.riskLevel,
    mitigationRecommendations: [
        "Keep current monitoring cadence.",
        "Review chill accumulation trend in plots under review."
    ],
    healthyPlotsCount: monitoringSummary.overallHealth.healthyPlotsCount,
    reviewPlotsCount: monitoringSummary.overallHealth.reviewPlotsCount
});

const toPlotMonitoringSummaryResource = (plotId = 1) => {
    const plot = plots.find((item) => String(item.id) === String(plotId)) ?? plots[0];
    return {
        plotId: plot.id,
        userId: plot.userId,
        plotName: plot.name,
        currentNdvi: plot.currentNdvi,
        ndviTrend: "UP",
        chillPortions: plot.chillPortions,
        chillPortionsWeeklyDelta: monitoringSummary.chillAccumulation.weeklyDiff,
        chillRequirementPortions: monitoringSummary.chillAccumulation.threshold,
        healthStatus: plot.healthStatus,
        phenologicalRisk: plot.phenologicalRisk,
        yieldForecastTonnes: Number((plot.areaSizeHectares * plot.currentNdvi * 1.85).toFixed(1)),
        weather: {
            temperatureCelsius: weatherSummaries[0].currentTemp,
            condition: weatherSummaries[0].condition,
            generatedAt: weatherSummaries[0].lastUpdate
        },
        climateRiskLevel: plot.phenologicalRisk,
        lastUpdatedAt: plot.lastUpdatedAt,
        recommendations: [
            "Maintain irrigation rhythm for the next 48 hours.",
            "Prioritize satellite review on plots with medium risk."
        ],
        climateSource: "Mock climate snapshot",
        ndviSource: "Mock Sentinel NDVI"
    };
};

const toPlotWeatherForecastResource = (plotId = 1) => {
    const plot = plots.find((item) => String(item.id) === String(plotId)) ?? plots[0];
    const weather = weatherSummaries[0];

    return {
        plotId: plot.id,
        userId: plot.userId,
        plotName: plot.name,
        generatedAt: weather.lastUpdate,
        hourly: [
            {
                timestamp: isoHoursAgo(1),
                temperatureCelsius: weather.currentTemp,
                humidityPercentage: 62,
                precipitationProbability: 8,
                weatherStatus: weatherStatus(weather.condition)
            },
            {
                timestamp: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                temperatureCelsius: weather.currentTemp + 1,
                humidityPercentage: 59,
                precipitationProbability: 12,
                weatherStatus: "PARTLY_CLOUDY"
            }
        ],
        daily: weather.forecast3Days.map((day, index) => ({
            date: dateDaysFromNow(index),
            minTemperatureCelsius: day.minTemp,
            maxTemperatureCelsius: day.maxTemp,
            averageTemperatureCelsius: Number(((day.minTemp + day.maxTemp) / 2).toFixed(1)),
            dominantStatus: weatherStatus(day.condition),
            precipitationProbability: index === 0 ? 8 : 18
        })),
        thermalAnomalyCelsius: weather.temperatureAnomaly,
        overallRisk: weather.climateRisk,
        warnings: ["Low thermal anomaly for the selected plot."],
        source: "Mock climate forecast"
    };
};

const toAgronomicStatisticResource = (params = {}) => ({
    ...agronomicStatistics[0],
    plotId: params.plotId || agronomicStatistics[0].plotId,
    timeRange: normalizeTimeRange(params.timeRange || agronomicStatistics[0].timeRange),
    chillHoursSeries: agronomicStatistics[0].cpSeries,
    chillRequirementSource: "PLOT_CONFIGURATION",
    chillMetricModel: "DYNAMIC_MODEL",
    chillUnit: "CP",
    cpTrend: "UP",
    ndviTrend: "UP"
});

const toNutritionPlanResource = (params = {}) => ({
    dynamicNutritionPlanId: 1,
    userId: Number(params.userId || 1),
    plotId: Number(params.plotId || 2),
    status: "PENDING_CERTIFICATION",
    inputRecommendations: [
        { input: "Potassium nitrate", purpose: "Support flowering", coverage: "12.8 ha", plannedRate: "18 kg/ha", status: "PLANNED" },
        { input: "Calcium boron", purpose: "Fruit set support", coverage: "12.8 ha", plannedRate: "2 L/ha", status: "PLANNED" }
    ],
    recommendedInputs: [
        { input: "Potassium nitrate", purpose: "Support flowering", coverage: "12.8 ha", plannedRate: "18 kg/ha", status: "Planned" },
        { input: "Calcium boron", purpose: "Fruit set support", coverage: "12.8 ha", plannedRate: "2 L/ha", status: "Planned" }
    ],
    applicationWindow: "Next 7 days",
    rationale: "Medium phenological risk with chill accumulation below campaign target.",
    generatedDate: isoHoursAgo(2),
    generatedAt: isoHoursAgo(2),
    certificationStatus: "PENDING",
    linkedAlertId: 1,
    riskLevel: "Medium",
    application: null
});

const toIotDeviceResource = (device) => ({
    id: device.id,
    plotId: device.plotId,
    deviceName: device.deviceName || device.name,
    name: device.name || device.deviceName,
    status: normalizeStatus(device.status),
    soilMoisture: device.soilMoisture,
    temperature: device.temperature,
    leafHumidity: device.leafHumidity,
    lastUpdate: device.lastUpdate
});

const toIotDeviceResources = (plotId) => {
    const data = plotId
        ? iotDevices.filter((device) => String(device.plotId) === String(plotId))
        : iotDevices;

    return data.map(toIotDeviceResource);
};

const response = (data) => Promise.resolve({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {}
});

export const hasConfiguredApiUrl = () => {
    const value = import.meta.env.VITE_VIORA_PLATFORM_API_URL;
    return typeof value === "string" && value.trim().length > 0;
};

export const mockVioraResponses = {
    health: () => response({ status: "UP" }),
    plots: () => response(plots.map(toBackendPlot)),
    plotsOverview: () => response({
        registeredPlotCount: plots.length,
        monitoredAreaHectares: plots.reduce((total, plot) => total + plot.areaSizeHectares, 0),
        climateLinkedPlotCount: plots.length,
        onlineDeviceCount: iotDevices.length,
        plots: plots.map(toBackendPlot)
    }),
    plotById: (id) => response(toBackendPlot(plots.find((plot) => String(plot.id) === String(id)) ?? plots[0])),
    createPlot: (plot) => response(toBackendPlot({ id: plots.length + 1, userId: 1, ...plot, lastUpdate: new Date().toISOString() })),
    updatePlot: (id, plot) => response(toBackendPlot({ ...(plots.find((item) => String(item.id) === String(id)) ?? plots[0]), ...plot, id })),
    deletePlot: () => response(null),
    configureChillRequirement: (plotId, chillRequirement) => response({ plotId, ...chillRequirement }),
    resetChillRequirement: (plotId) => response({ plotId, chillRequirementPortions: null }),
    plotDetail: (plotId) => response({
        ...toBackendPlot(plots.find((plot) => String(plot.id) === String(plotId)) ?? plots[0]),
        monitoringSummary: toPlotMonitoringSummaryResource(plotId),
        weatherForecast: toPlotWeatherForecastResource(plotId),
        iotDevices: toIotDeviceResources(plotId)
    }),
    records: (params = {}) => {
        const plotId = params.plotId;
        const data = plotId
            ? agronomicRecords.filter((record) => String(record.plotId) === String(plotId))
            : agronomicRecords;
        return response({ agronomicRecords: data.length ? data : agronomicRecords });
    },
    monitoringSummary: () => response(toCurrentMonitoringSummaryResource()),
    plotMonitoringSummary: (plotId) => response(toPlotMonitoringSummaryResource(plotId)),
    ndviTile: (plotId, zoom, x, y) => response({
        plotId,
        zoom,
        x,
        y,
        tileUrl: `/api/v1/plots/${plotId}/imagery/tile/${zoom}/${x}/${y}`
    }),
    weather: (params = {}) => response(toPlotWeatherForecastResource(params.plotId || 1)),
    plotWeatherForecast: (plotId) => response(toPlotWeatherForecastResource(plotId)),
    yieldForecast: (plotId) => response([{
        ...yieldForecasts.find((item) => String(item.plotId) === String(plotId)),
        tonnes: toPlotMonitoringSummaryResource(plotId).yieldForecastTonnes,
        riskLevel: toPlotMonitoringSummaryResource(plotId).climateRiskLevel,
        description: `Risk of alternate bearing: ${toPlotMonitoringSummaryResource(plotId).climateRiskLevel}`
    }]),
    statistics: (params = {}) => response([toAgronomicStatisticResource(params)]),
    statisticsSeries: (params = {}) => response(toAgronomicStatisticResource(params)),
    ingestAgronomicStatistics: (snapshot) => response({ accepted: true, snapshot }),
    generateNutritionPlan: (params = {}) => response(toNutritionPlanResource(params)),
    activeNutritionPlan: (params = {}) => response(toNutritionPlanResource(params)),
    certifyNutritionPlan: (planId, certification) => response({
        ...toNutritionPlanResource(),
        dynamicNutritionPlanId: Number(planId),
        certificationStatus: "CERTIFIED",
        application: certification ?? { certifiedAt: new Date().toISOString() }
    }),
    iotDevices: (plotId) => response(toIotDeviceResources(plotId)),
    iotDevicesByPlot: (plotId) => response(toIotDeviceResources(plotId)),
    iotDeviceById: (id) => response(toIotDeviceResource(iotDevices.find((device) => String(device.id) === String(id)) ?? iotDevices[0])),
    createIotDevice: (device) => response(toIotDeviceResource({
        id: iotDevices.length + 1,
        plotId: device.plotId,
        name: device.deviceName || device.name,
        status: device.status,
        soilMoisture: 0,
        temperature: 0,
        leafHumidity: 0,
        lastUpdate: new Date().toISOString()
    })),
    updateIotDevice: (id, device) => response(toIotDeviceResource({
        ...(iotDevices.find((item) => String(item.id) === String(id)) ?? iotDevices[0]),
        ...device,
        id,
        name: device.deviceName || device.name,
        status: device.iotDeviceStatus || device.status,
        lastUpdate: new Date().toISOString()
    })),
    deleteIotDevice: () => response(null),
    iotDeviceSummaries: () => response(iotDeviceSummary),
    alerts: (params = {}) => response(alerts.slice(0, Number(params.limit || alerts.length)))
};
