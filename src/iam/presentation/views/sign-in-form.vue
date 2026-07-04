<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import { SignInCommand } from '../../domain/model/sign-in.command.js';

const router = useRouter();
const store = useIamStore();

const email = ref('');
const password = ref('');

onMounted(() => {
  store.clearMessages();
});

const canSubmit = () => email.value.trim().length > 3 && password.value.length >= 8 && !store.busy;

async function submit() {
  if (!canSubmit()) return;
  const command = new SignInCommand({ email: email.value, password: password.value });
  const result = await store.signIn(command);
  if (result.success) router.push({ name: 'dashboard' });
}

function resend() {
  if (email.value.trim()) {
    store.resendVerification(email.value);
  }
}
</script>

<template>
  <section class="auth-shell">
    <form class="auth-card auth-form" @submit.prevent="submit">
      <div class="auth-brand">
        <img src="/assets/icons/dashboard/viora-isotipo-green.png" alt="Viora" />
        <strong>Viora</strong>
      </div>

      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-subtitle">Sign in to monitor your groves, alerts and interventions.</p>

      <p v-if="store.error" class="auth-error">&#x26A0; {{ store.error }}</p>
      <p v-if="store.info" class="auth-info">&#x2714; {{ store.info }}</p>

      <label class="field">
        <span>Email</span>
        <input
          type="email"
          autocomplete="email"
          placeholder="you@yourfarm.com"
          v-model="email"
        />
      </label>

      <label class="field">
        <span>Password</span>
        <input
          type="password"
          autocomplete="current-password"
          placeholder="Your password"
          v-model="password"
        />
      </label>

      <button
        v-if="store.needsVerification"
        type="button"
        class="auth-link-button"
        @click="resend"
      >
        Resend the verification email
      </button>

      <button type="submit" class="auth-submit" :disabled="!canSubmit()">
        {{ store.busy ? 'Signing in\u2026' : 'Sign in' }}
      </button>

      <p class="auth-foot">New to Viora? <router-link to="/iam/sign-up">Create an account</router-link></p>
    </form>
  </section>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f8f4ed;
  font-family: 'Poppins', sans-serif;
}

.auth-card {
  width: min(460px, 100%);
  padding: 36px 34px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(31, 37, 35, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.auth-brand img { width: 34px; height: 34px; }
.auth-brand strong { font-size: 20px; font-weight: 600; color: #1f2523; }
.auth-title { margin: 6px 0 0; text-align: center; font-size: 22px; font-weight: 600; color: #1f2523; }
.auth-subtitle { margin: 0; text-align: center; font-size: 14px; font-weight: 400; color: #828282; line-height: 1.5; }

.auth-form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field > span { font-size: 13px; font-weight: 500; color: #333; }

.field input {
  height: 46px;
  padding: 0 14px;
  border: 1px solid #e2ddd4;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #333;
  outline: none;
  background: #fff;
  transition: border-color 0.15s ease;
}

.field input:focus { border-color: #2e4a3a; }
.field input::placeholder { color: #a7a29a; }

.auth-error, .auth-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
}

.auth-error { background: rgba(255, 92, 92, 0.1); color: #d63b3b; }
.auth-info { background: rgba(87, 235, 161, 0.14); color: #2e7d55; }

.auth-submit {
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #2e4a3a;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.auth-submit:hover { opacity: 0.92; }
.auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }

.auth-link-button {
  border: none;
  background: transparent;
  padding: 0;
  color: #2e4a3a;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.auth-foot { margin: 4px 0 0; text-align: center; font-size: 13px; font-weight: 400; color: #6f6a62; }
.auth-foot a { color: #2e4a3a; font-weight: 600; text-decoration: none; }
.auth-foot a:hover { text-decoration: underline; }
</style>
