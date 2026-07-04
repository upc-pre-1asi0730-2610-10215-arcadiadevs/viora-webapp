import { SignInResource } from './sign-in.resource.js';

export class SignInAssembler {
  static toResourceFromResponse(response) {
    if (response.status !== 200) {
      return null;
    }
    return new SignInResource(response.data);
  }
}
