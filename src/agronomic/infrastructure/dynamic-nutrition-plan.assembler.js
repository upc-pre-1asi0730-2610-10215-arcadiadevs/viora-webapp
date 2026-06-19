/**
 * @file dynamic-nutrition-plan.assembler.js
 * @description Maps the Dynamic Nutrition API payload (platform
 * `DynamicNutritionPlanResource`) into the domain entity.
 */
import { DynamicNutritionPlan } from "../domain/model/dynamic-nutrition-plan.entity.js";
import { normalizeClimateRisk } from "./status-normalizers.js";

/**
 * @class DynamicNutritionPlanAssembler
 */
export class DynamicNutritionPlanAssembler {
    static #toInputStatus(value) {
        return (value ?? '').trim().toUpperCase() === 'OPTIONAL' ? 'Optional' : 'Recommended';
    }

    static #toCertificationStatus(value) {
        return (value ?? '').trim().toUpperCase() === 'CERTIFIED' ? 'Certified' : 'Pending';
    }

    static #toInput(resource = {}) {
        return {
            name: resource.value ?? '',
            purpose: resource.purpose ?? '',
            dosage: resource.dosage ?? 0,
            dosageUnit: resource.dosageUnit ?? '',
            status: this.#toInputStatus(resource.status)
        };
    }

    static #toApplication(resource) {
        if (!resource) return null;
        return {
            applicationDate: resource.applicationDate ?? '',
            applicationTime: resource.applicationTime ?? '',
            appliedInputs: resource.appliedInputs ?? [],
            doseConfirmation: resource.doseConfirmation ?? '',
            fieldOperator: resource.fieldOperator ?? '',
            fieldNotes: resource.fieldNotes ?? ''
        };
    }

    /**
     * @param {Object|null|undefined} resource - Raw plan payload.
     * @returns {DynamicNutritionPlan|null}
     */
    static toEntityFromResource(resource) {
        if (!resource) return null;

        return new DynamicNutritionPlan({
            id: resource.dynamicNutritionPlanId ?? null,
            userId: resource.userId ?? null,
            plotId: resource.plotId ?? null,
            status: this.#toInputStatus(resource.status),
            inputs: (resource.inputRecommendations ?? []).map((input) => this.#toInput(input)),
            applicationWindow: resource.applicationWindow
                ? {
                    startDate: resource.applicationWindow.startDate ?? '',
                    endDate: resource.applicationWindow.endDate ?? ''
                }
                : null,
            rationale: resource.rationale
                ? {
                    summary: resource.rationale.summary ?? '',
                    triggeringRiskLevel: resource.rationale.triggeringRiskLevel
                        ? normalizeClimateRisk(resource.rationale.triggeringRiskLevel)
                        : '',
                    ndviValue: resource.rationale.ndviValue ?? 0,
                    temperatureAnomaly: resource.rationale.temperatureAnomaly ?? 0
                }
                : null,
            generatedDate: resource.generatedDate ?? '',
            certificationStatus: this.#toCertificationStatus(resource.certificationStatus),
            application: this.#toApplication(resource.application)
        });
    }

    /**
     * Parses the plan entity from an Axios response, accepting a single object or
     * the json-server filtered array.
     * @param {import('axios').AxiosResponse<Object|Array<Object>>} response
     * @returns {DynamicNutritionPlan|null}
     */
    static toEntityFromResponse(response) {
        const data = response?.data;
        const resource = Array.isArray(data) ? data[0] : data;
        return this.toEntityFromResource(resource);
    }
}
