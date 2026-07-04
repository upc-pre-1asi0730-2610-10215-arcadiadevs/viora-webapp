import { SignUpResource } from './sign-up.resource.js';

export class SignUpAssembler {
  static toResourceFromResponse(response) {
    if (response.status !== 200) {
      return null;
    }
    return new SignUpResource(response.data);
  }
}
