/**
 * Private specialist contact details, revealed only once the related
 * proposal has been accepted.
 * @class SpecialistContact
 */
export class SpecialistContact {
    /**
     * @param {Object} params
     * @param {number|null} [params.specialistId=null]
     * @param {string} [params.fullName='']
     * @param {string} [params.phone='']
     * @param {string} [params.email='']
     * @param {string} [params.whatsapp='']
     */
    constructor({
        specialistId = null,
        fullName = '',
        phone = '',
        email = '',
        whatsapp = '',
    } = {}) {
        this.specialistId = specialistId;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.whatsapp = whatsapp;
    }
}
