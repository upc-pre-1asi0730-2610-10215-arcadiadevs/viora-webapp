import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const authPath = import.meta.env.VITE_AUTH_ENDPOINT_PATH || '/authentication';
const usersPath = import.meta.env.VITE_USERS_ENDPOINT_PATH || '/users';

export class IamApi extends BaseApi {
  #authEndpoint;
  #usersEndpoint;

  constructor() {
    super();
    this.#authEndpoint = new BaseEndpoint(this, authPath);
    this.#usersEndpoint = new BaseEndpoint(this, usersPath);
  }

  signIn(request) {
    return this.http.post(`${this.#authEndpoint.endpointPath}/sign-in`, {
      username: request.username ?? request.email,
      password: request.password
    });
  }

  signUp(request) {
    const email = request.email;
    return this.http.post(`${this.#authEndpoint.endpointPath}/sign-up`, {
      username: request.username ?? email,
      password: request.password,
      email,
      fullName: request.fullName,
      role: request.role,
      referralCode: request.referralCode,
      phone: request.phone
    });
  }

  verify(token) {
    return this.http.post(`${this.#authEndpoint.endpointPath}/verify`, { token });
  }

  resendVerification(email) {
    return this.http.post(`${this.#authEndpoint.endpointPath}/resend-verification`, { email });
  }

  getSessions(userId) {
    return this.http.get(`${this.#usersEndpoint.endpointPath}/${userId}/sessions`);
  }

  revokeSession(userId, sessionId) {
    return this.http.delete(`${this.#usersEndpoint.endpointPath}/${userId}/sessions/${sessionId}`);
  }

  changePassword(userId, request) {
    return this.http.put(`${this.#usersEndpoint.endpointPath}/${userId}/password`, request);
  }

  deactivateAccount(userId) {
    return this.http.patch(`${this.#usersEndpoint.endpointPath}/${userId}`, { active: false });
  }
}
