/**
 * @file plot-detail.assembler.js
 * @description Maps the GET /plots/{plotId}/detail resource (platform
 * `PlotDetailResource`) into the PlotDetail domain entity.
 */
import { PlotDetail } from "../domain/model/plot-detail.entity.js";
import { normalizeMonitoringLink } from "./status-normalizers.js";

/**
 * @class PlotDetailAssembler
 */
export class PlotDetailAssembler {
    /**
     * @param {Object|null|undefined} resource - Raw plot-detail payload.
     * @returns {PlotDetail|null}
     */
    static toEntityFromResource(resource) {
        if (!resource) return null;

        const links = resource.monitoringLinks ?? {};
        const iot = resource.iot ?? {};

        return new PlotDetail({
            id: resource.id ?? null,
            name: resource.name ?? '',
            location: resource.location ?? '',
            campaign: resource.campaign ?? '',
            cropType: resource.cropType ?? '',
            variety: resource.variety ?? '',
            notes: resource.notes ?? '',
            polygonCoordinates: resource.polygonCoordinates ?? [],
            areaSizeHectares: resource.areaSizeHectares ?? 0,
            boundaryPointCount: resource.boundaryPointCount ?? 0,
            boundaryStatus: resource.boundaryStatus ?? '',
            registeredAt: resource.registeredAt ?? '',
            lastConfigurationUpdateAt: resource.lastConfigurationUpdateAt ?? '',
            climateMonitoring: normalizeMonitoringLink(links.climateMonitoring),
            satelliteNdvi: normalizeMonitoringLink(links.satelliteNdvi),
            climateLastSyncAt: links.climateLastSyncAt ?? '',
            satelliteLastSyncAt: links.satelliteLastSyncAt ?? '',
            iotStatus: normalizeMonitoringLink(iot.status),
            linkedDeviceCount: iot.linkedDeviceCount ?? 0,
            onlineDeviceCount: iot.onlineDeviceCount ?? 0,
            iotLastActivityAt: iot.lastActivityAt ?? '',
            devices: (resource.devices ?? []).map((device) => ({
                id: device.id ?? null,
                name: device.name ?? '',
                status: device.status ?? '',
                lastActivityAt: device.lastActivityAt ?? ''
            })),
            activity: (resource.recentConfigurationActivity ?? []).map((item) => ({
                type: item.type ?? '',
                description: item.description ?? '',
                occurredAt: item.occurredAt ?? ''
            }))
        });
    }

    /**
     * Parses the detail entity from an Axios response, accepting either a single
     * object or the json-server filtered array.
     * @param {import('axios').AxiosResponse<Object|Array<Object>>} response
     * @returns {PlotDetail|null}
     */
    static toEntityFromResponse(response) {
        const data = response?.data;
        const resource = Array.isArray(data) ? data[0] : data;
        return this.toEntityFromResource(resource);
    }
}
