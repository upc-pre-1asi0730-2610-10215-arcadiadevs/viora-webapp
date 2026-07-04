/**
 * Command object representing a user's intent to sign up.
 * Encapsulates the registration data needed for account creation.
 *
 * @class SignUpCommand
 */
export class SignUpCommand {
    /**
     * @param {Object} params
     * @param {string} params.email - User's email address.
     * @param {string} params.password - User's password.
     * @param {string} [params.fullName=''] - User's full name.
     * @param {string} [params.role='ROLE_GROWER'] - User's role.
     * @param {string|null} [params.referralCode=null] - Optional referral code.
     */
    constructor({ email, password, fullName = '', role = 'ROLE_GROWER', referralCode = null }) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.referralCode = referralCode;
    }
}
