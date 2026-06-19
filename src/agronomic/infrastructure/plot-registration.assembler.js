/**
 * @file plot-registration.assembler.js
 * @description Maps the POST /plots response (platform `PlotRegistrationResource`)
 * into the PlotRegistration domain entity used by the wizard confirmation step.
 */
import { PlotRegistration } from "../domain/model/plot-registration.entity.js";
import { normalizeMonitoringLink } from "./status-normalizers.js";

/**
 * @class PlotRegistrationAssembler
 */
export class PlotRegistrationAssembler {
    /**
     * @param {Object|null|undefined} resource - Raw registration payload.
     * @returns {PlotRegistration}
     */
    static toEntityFromResource(resource) {
        return new PlotRegistration({
            id: resource?.id ?? null,
            name: resource?.name ?? '',
            location: resource?.location ?? '',
            campaign: resource?.campaign ?? '',
            cropType: resource?.cropType ?? '',
            variety: resource?.variety ?? '',
            notes: resource?.notes ?? '',
            polygonCoordinates: resource?.polygonCoordinates ?? [],
            areaSizeHectares: resource?.areaSizeHectares ?? 0,
            state: resource?.state ?? '',
            climateMonitoring: normalizeMonitoringLink(resource?.climateMonitoring),
            satelliteNdvi: normalizeMonitoringLink(resource?.satelliteNdvi),
            iotDevices: normalizeMonitoringLink(resource?.iotDevices)
        });
    }
}
