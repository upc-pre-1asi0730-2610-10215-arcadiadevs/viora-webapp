/**
 * Command object representing a user's intent to sign in.
 * Encapsulates the credentials needed for authentication.
 *
 * @class SignInCommand
 */
export class SignInCommand {
    /**
     * @param {Object} params
     * @param {string} params.email - User's email address.
     * @param {string} params.password - User's password.
     */
    constructor({ email, password }) {
        this.email = email;
        this.password = password;
    }
}
