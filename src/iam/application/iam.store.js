import { getIamApi } from '../infrastructure/iam-api-instance.js';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SignInAssembler } from '../infrastructure/sign-in.assembler.js';
import { SignUpAssembler } from '../infrastructure/sign-up.assembler.js';

const iamApi = getIamApi();

export const useIamStore = defineStore('iam', () => {
  const busy = ref(false);
  const error = ref(null);
  const info = ref(null);
  const needsVerification = ref(false);

  const isSignedIn = ref(!!localStorage.getItem('token'));
  const currentEmail = ref(localStorage.getItem('email') || null);
  const currentFullName = ref(localStorage.getItem('fullName') || null);
  const currentUserId = ref(Number(localStorage.getItem('userId')) || 0);
  const currentRole = ref(localStorage.getItem('role') || null);
  const currentToken = computed(() => isSignedIn.value ? localStorage.getItem('token') : null);

  function clearMessages() {
    error.value = null;
    info.value = null;
    needsVerification.value = false;
  }

  function beginRequest() {
    busy.value = true;
    clearMessages();
  }

  function enterSession(auth) {
    if (!auth?.token || auth.id == null) {
      error.value = 'Unexpected response from the server.';
      return false;
    }
    currentEmail.value = auth.email ?? '';
    currentFullName.value = auth.fullName ?? '';
    currentUserId.value = auth.id;
    currentRole.value = auth.role ?? 'ROLE_GROWER';
    localStorage.setItem('token', auth.token);
    localStorage.setItem('email', auth.email ?? '');
    localStorage.setItem('fullName', auth.fullName ?? '');
    localStorage.setItem('userId', String(auth.id));
    localStorage.setItem('role', auth.role ?? 'ROLE_GROWER');
    isSignedIn.value = true;
    return true;
  }

  /**
   * Authenticates the user with the given credentials.
   * @param {import('../domain/model/sign-in.command.js').SignInCommand} command
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function signIn(command) {
    beginRequest();
    try {
      const response = await iamApi.signIn({ email: command.email.trim().toLowerCase(), password: command.password });
      const resource = SignInAssembler.toResourceFromResponse(response);
      if (resource) {
        enterSession(resource);
        busy.value = false;
        return { success: true };
      }
      busy.value = false;
      error.value = 'Invalid email or password.';
      return { success: false, error: error.value };
    } catch (err) {
      busy.value = false;
      const message = err?.response?.data?.message ?? '';
      if (err?.response?.status === 422 || message.toLowerCase().includes('verify')) {
        needsVerification.value = true;
        error.value = 'Your email is not verified yet. Check your inbox or resend the email.';
      } else if (err?.response?.status === 404) {
        error.value = 'No account found with that email.';
      } else if (err?.response?.status === 403) {
        error.value = 'This account has been deactivated.';
      } else {
        error.value = 'Invalid email or password.';
      }
      return { success: false, error: error.value };
    }
  }

  /**
   * Registers a new user account.
   * @param {import('../domain/model/sign-up.command.js').SignUpCommand} command
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function signUp(command) {
    beginRequest();
    try {
      await iamApi.signUp({
        email: command.email.trim().toLowerCase(),
        password: command.password,
        role: command.role,
        fullName: command.fullName,
        referralCode: command.referralCode
      });
      busy.value = false;
      return { success: true };
    } catch (err) {
      busy.value = false;
      const message = err?.response?.data?.message ?? '';
      if (err?.response?.status === 409) {
        error.value = 'An account with this email already exists.';
      } else if (message.toLowerCase().includes('referral')) {
        error.value = 'That referral code does not exist. Remove it or fix it.';
      } else {
        error.value = message || 'Could not create your account. Check the form and try again.';
      }
      return { success: false, error: error.value };
    }
  }

  /**
   * Verifies the user's email with the given token.
   * @param {string} token
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function verify(token) {
    beginRequest();
    try {
      const response = await iamApi.verify(token);
      const resource = SignInAssembler.toResourceFromResponse(response);
      if (resource) {
        enterSession(resource);
        busy.value = false;
        return { success: true };
      }
      busy.value = false;
      error.value = 'Unexpected response from the server.';
      return { success: false, error: error.value };
    } catch (err) {
      busy.value = false;
      error.value = err?.response?.data?.message ?? 'This verification link is invalid, expired or already used.';
      return { success: false, error: error.value };
    }
  }

  function resendVerification(email) {
    beginRequest();
    iamApi.resendVerification(email.trim().toLowerCase())
      .then(() => {
        busy.value = false;
        info.value = 'Verification email sent. Check your inbox.';
      })
      .catch(err => {
        busy.value = false;
        error.value = err?.response?.data?.message ?? 'Could not resend the verification email.';
      });
  }

  function signOut() {
    currentEmail.value = null;
    currentFullName.value = null;
    currentUserId.value = 0;
    currentRole.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    isSignedIn.value = false;
    clearMessages();
  }

  return {
    busy,
    error,
    info,
    needsVerification,
    isSignedIn,
    currentEmail,
    currentFullName,
    currentUserId,
    currentRole,
    currentToken,
    clearMessages,
    signIn,
    signUp,
    verify,
    resendVerification,
    signOut
  };
});

export default useIamStore;
