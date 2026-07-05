<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';

const route = useRoute();
const router = useRouter();
const store = useIamStore();

const state = ref('verifying');

onMounted(async () => {
  store.clearMessages();
  const token = route.query.token;
  if (!token) {
    state.value = 'error';
    return;
  }
  const result = await store.verify(token);
  state.value = result.success ? 'success' : 'error';
  if (result.success) router.push(result.redirect ?? { name: 'dashboard' });
});
</script>

<template>
  <section class="auth-shell">
    <div class="auth-card">
      <div class="auth-brand">
        <img src="/assets/icons/dashboard/viora-isotipo-green.png" alt="Viora" />
        <strong>Viora</strong>
      </div>

      <template v-if="state === 'verifying'">
        <span class="status-icon is-wait">&#x23F3;</span>
        <h1 class="auth-title">Verifying your email&#x2026;</h1>
        <p class="auth-subtitle">One moment while we confirm your account.</p>
      </template>

      <template v-else-if="state === 'success'">
        <span class="status-icon">&#x2714;</span>
        <h1 class="auth-title">Email verified!</h1>
        <p class="auth-subtitle">Your account is active — taking you to your workspace&#x2026;</p>
      </template>

      <template v-else>
        <span class="status-icon is-error">&#x1F517;</span>
        <h1 class="auth-title">Verification failed</h1>
        <p class="auth-subtitle">
          {{ store.error || 'This verification link is invalid, expired or already used.' }}
        </p>
        <p class="auth-foot">
          <router-link to="/login">Back to sign in</router-link> — you can resend the email from there.
        </p>
      </template>
    </div>
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
  align-items: center;
}

.auth-brand { display: flex; align-items: center; gap: 10px; justify-content: center; }
.auth-brand img { width: 34px; height: 34px; }
.auth-brand strong { font-size: 20px; font-weight: 600; color: #1f2523; }
.auth-title { margin: 6px 0 0; text-align: center; font-size: 22px; font-weight: 600; color: #1f2523; }
.auth-subtitle { margin: 0; text-align: center; font-size: 14px; font-weight: 400; color: #828282; line-height: 1.5; }

.auth-foot { margin: 4px 0 0; text-align: center; font-size: 13px; font-weight: 400; color: #6f6a62; }
.auth-foot a { color: #2e4a3a; font-weight: 600; text-decoration: none; }
.auth-foot a:hover { text-decoration: underline; }

.status-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(87, 235, 161, 0.22);
  color: #2e7d55;
  font-size: 30px;
}

.status-icon.is-error {
  background: rgba(255, 92, 92, 0.14);
  color: #d63b3b;
}

.status-icon.is-wait {
  background: #f0ebe3;
  color: #8c877f;
}
</style>
