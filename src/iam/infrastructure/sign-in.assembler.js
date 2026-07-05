import { SignInResource } from './sign-in.resource.js';

export class SignInAssembler {
  static toResourceFromResponse(response) {
    if (response.status !== 200) {
      return null;
    }
    if (!response.data?.token || response.data?.id == null) {
      return null;
    }
    return new SignInResource(response.data);
  }
}
