/**
 * @file my-plots-overview.assembler.js
 * @description Maps the GET /plots/overview resource (platform
 * `MyPlotsOverviewResource`) into the My Plots overview domain entity.
 */
import {
    MyPlotOverviewItem,
    MyPlotsOverview
} from "../domain/model/my-plots-overview.entity.js";
import {
    normalizePhenologicalRisk,
    normalizePlotHealthStatus
} from "./status-normalizers.js";

/**
 * @class MyPlotsOverviewAssembler
 */
export class MyPlotsOverviewAssembler {
    /**
     * Maps a single plot resource into its domain item.
     * @param {Object} resource - Raw plot row from the overview response.
     * @returns {MyPlotOverviewItem}
     */
    static toItem(resource = {}) {
        return new MyPlotOverviewItem({
            id: resource.id ?? null,
            name: resource.name ?? '',
            location: resource.location ?? '',
            cropType: resource.cropType ?? '',
            areaSizeHectares: resource.areaSizeHectares ?? 0,
            polygonCoordinates: resource.polygonCoordinates ?? [],
            healthStatus: normalizePlotHealthStatus(resource.healthStatus),
            phenologicalRisk: normalizePhenologicalRisk(resource.phenologicalRisk),
            currentNdvi: resource.currentNdvi ?? 0,
            chillPortions: resource.chillPortions ?? 0,
            onlineDeviceCount: resource.onlineDeviceCount ?? 0,
            activeAlertCount: resource.activeAlertCount ?? 0,
            lastUpdatedAt: resource.lastUpdatedAt ?? ''
        });
    }

    /**
     * Maps a raw overview resource into the aggregated domain entity.
     * @param {Object|null|undefined} resource - Raw overview payload.
     * @returns {MyPlotsOverview}
     */
    static toEntityFromResource(resource) {
        return new MyPlotsOverview({
            registeredPlotCount: resource?.registeredPlotCount ?? 0,
            monitoredAreaHectares: resource?.monitoredAreaHectares ?? 0,
            climateLinkedPlotCount: resource?.climateLinkedPlotCount ?? 0,
            onlineDeviceCount: resource?.onlineDeviceCount ?? 0,
            plots: (resource?.plots ?? []).map((plot) => this.toItem(plot))
        });
    }

    /**
     * Parses the overview entity from an Axios response. The endpoint returns a
     * single object, so a null/invalid payload yields an empty overview.
     * @param {import('axios').AxiosResponse<Object>} response - Axios response.
     * @returns {MyPlotsOverview}
     */
    static toEntityFromResponse(response) {
        if (!response || response.status !== 200 || !response.data) {
            console.error(`[MyPlotsOverviewAssembler] Mapping error: Invalid response status ${response?.status}`);
            return new MyPlotsOverview();
        }

        return this.toEntityFromResource(response.data);
    }
}
