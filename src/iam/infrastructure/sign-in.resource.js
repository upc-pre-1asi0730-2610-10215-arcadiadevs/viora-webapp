export class SignInResource {
  constructor({ id, email, fullName, token, role }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.token = token;
    this.role = role;
  }
}
