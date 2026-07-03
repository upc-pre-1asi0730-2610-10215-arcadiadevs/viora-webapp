import { SpecialistContact } from '../domain/model/specialist-contact.entity.js';

/**
 * Backend resource shape for `GET /specialists/{id}/contact`.
 * @typedef {Object} SpecialistContactResource
 * @property {number|null} specialistId
 * @property {string|null} fullName
 * @property {string|null} phone
 * @property {string|null} email
 * @property {string|null} whatsapp
 */

export class SpecialistContactAssembler {
    /**
     * @param {SpecialistContactResource} resource
     * @returns {SpecialistContact}
     */
    static toEntityFromResource(resource) {
        return new SpecialistContact({
            specialistId: resource.specialistId ?? null,
            fullName: resource.fullName ?? '',
            phone: resource.phone ?? '',
            email: resource.email ?? '',
            whatsapp: resource.whatsapp ?? '',
        });
    }
}
