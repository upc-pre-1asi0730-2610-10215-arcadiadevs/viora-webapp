<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import { SignUpCommand } from '../../domain/model/sign-up.command.js';

const route = useRoute();
const router = useRouter();
const store = useIamStore();

const fullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref('ROLE_GROWER');
const referralCode = ref('');
const submitted = ref(false);

onMounted(() => {
  store.clearMessages();
  const refCode = route.query.ref;
  if (refCode) {
    referralCode.value = refCode.toUpperCase();
  }
});

const passwordsMismatch = computed(() => confirmPassword.value.length > 0 && password.value !== confirmPassword.value);

const canSubmit = computed(() =>
  fullName.value.trim().length > 1 &&
  email.value.trim().length > 3 &&
  password.value.length >= 8 &&
  password.value === confirmPassword.value &&
  !store.busy
);

async function submit() {
  if (!canSubmit.value) return;
  const command = new SignUpCommand({
    email: email.value,
    password: password.value,
    role: role.value,
    fullName: fullName.value.trim(),
    referralCode: referralCode.value.trim() || null
  });
  const result = await store.signUp(command);
  if (result.success) submitted.value = true;
}

function resend() {
  store.resendVerification(email.value);
}
</script>

<template>
  <section class="auth-shell">
    <template v-if="!submitted">
      <form class="auth-card auth-form" @submit.prevent="submit">
        <div class="auth-brand">
          <img src="/assets/icons/dashboard/viora-isotipo-green.png" alt="Viora" />
          <strong>Viora</strong>
        </div>

        <h1 class="auth-title">Create your account</h1>
        <p class="auth-subtitle">Join Viora to monitor groves or assist producers in the field.</p>

        <p v-if="store.error" class="auth-error">&#x26A0; {{ store.error }}</p>

        <div class="role-grid">
          <button
            type="button"
            class="role-card"
            :class="{ 'is-active': role === 'ROLE_GROWER' }"
            @click="role = 'ROLE_GROWER'"
          >
            <span class="role-icon">&#x1F33F;</span>
            <strong>Producer</strong>
            <span>Monitor plots, IoT devices and alerts</span>
          </button>
          <button
            type="button"
            class="role-card"
            :class="{ 'is-active': role === 'ROLE_SPECIALIST' }"
            @click="role = 'ROLE_SPECIALIST'"
          >
            <span class="role-icon">&#x1FA7A;</span>
            <strong>Specialist</strong>
            <span>Assist producers with field expertise</span>
          </button>
        </div>

        <label class="field">
          <span>Full name</span>
          <input type="text" autocomplete="name" placeholder="e.g. Maria Torres" v-model="fullName" />
        </label>

        <label class="field">
          <span>Email</span>
          <input type="email" autocomplete="email" placeholder="you@yourfarm.com" v-model="email" />
        </label>

        <label class="field">
          <span>Password</span>
          <input type="password" autocomplete="new-password" placeholder="At least 8 characters" v-model="password" />
        </label>

        <label class="field">
          <span>Confirm password</span>
          <input type="password" autocomplete="new-password" placeholder="Repeat your password" v-model="confirmPassword" />
          <span v-if="passwordsMismatch" class="field-hint" style="color: #d63b3b">Passwords do not match.</span>
        </label>

        <label class="field">
          <span>Referral code (optional)</span>
          <input type="text" placeholder="e.g. VIORA-4JYFFQ" v-model="referralCode" />
          <span class="field-hint">Invited by a partner? Their code rewards them when you join.</span>
        </label>

        <button type="submit" class="auth-submit" :disabled="!canSubmit">
          {{ store.busy ? 'Creating account\u2026' : 'Create account' }}
        </button>

        <p class="auth-foot">Already have an account? <router-link to="/iam/sign-in">Sign in</router-link></p>
      </form>
    </template>

    <template v-else>
      <div class="auth-card">
        <span class="status-icon">&#x2709;</span>
        <h1 class="auth-title">Check your email</h1>
        <p class="auth-subtitle">
          We sent a verification link to <strong>{{ email }}</strong>. Open it to activate your
          account — the link expires in 24 hours.
        </p>

        <p v-if="store.info" class="auth-info">&#x2714; {{ store.info }}</p>
        <p v-if="store.error" class="auth-error">&#x26A0; {{ store.error }}</p>

        <button type="button" class="auth-submit" :disabled="store.busy" @click="resend">
          {{ store.busy ? 'Sending\u2026' : 'Resend email' }}
        </button>
        <p class="auth-foot">Verified already? <router-link to="/iam/sign-in">Sign in</router-link></p>
      </div>
    </template>
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

.auth-brand { display: flex; align-items: center; gap: 10px; justify-content: center; }
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
.field-hint { font-size: 12px; font-weight: 400; color: #a7a29a; }

.role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border: 1px solid #e2ddd4;
  border-radius: 12px;
  background: #fff;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.role-icon { font-size: 24px; }
.role-card strong { font-size: 14px; font-weight: 600; color: #333; }
.role-card span { font-size: 11px; font-weight: 400; color: #828282; text-align: center; line-height: 1.35; }

.role-card.is-active {
  border-color: #2e4a3a;
  background: #f0f7f4;
}

.role-card.is-active .role-icon { filter: none; }
.role-card.is-active strong { color: #2e4a3a; }

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

.auth-foot { margin: 4px 0 0; text-align: center; font-size: 13px; font-weight: 400; color: #6f6a62; }
.auth-foot a { color: #2e4a3a; font-weight: 600; text-decoration: none; }
.auth-foot a:hover { text-decoration: underline; }

.status-icon {
  align-self: center;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(87, 235, 161, 0.22);
  color: #2e7d55;
  font-size: 30px;
}
</style>
