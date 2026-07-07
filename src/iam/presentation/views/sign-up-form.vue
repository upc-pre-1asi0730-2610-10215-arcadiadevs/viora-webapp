<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import { SignUpCommand } from '../../domain/model/sign-up.command.js';
import { SignInCommand } from '../../domain/model/sign-in.command.js';
import { useSubscriptionStore } from '../../../billing/application/subscription.store.js';

const route = useRoute();
const router = useRouter();
const store = useIamStore();
const subscriptionStore = useSubscriptionStore();

const fullName = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref('ROLE_GROWER');
const referralCode = ref('');
const submitted = ref(false);
const redirecting = ref(false);

const selectedPlan = ref(null);
let selectedInterval = 'MONTHLY';

onMounted(() => {
  store.clearMessages();
  const refCode = route.query.ref;
  if (refCode) referralCode.value = refCode.toUpperCase();

  const queryRole = route.query.role;
  if (queryRole === 'ROLE_SPECIALIST' || queryRole === 'ROLE_GROWER') role.value = queryRole;

  const plan = route.query.plan;
  if (plan) {
    selectedPlan.value = plan;
    selectedInterval = route.query.interval === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
  } else {
    // Payment-first: you can't register without first choosing a plan.
    router.replace({ path: '/plans', query: refCode ? { ref: refCode } : {} });
  }
});

const roleLocked = computed(() => selectedPlan.value !== null);
const phoneRequired = computed(() => role.value === 'ROLE_SPECIALIST');
const phoneMissing = computed(() => phoneRequired.value && phone.value.trim().length === 0);
const passwordsMismatch = computed(() => confirmPassword.value.length > 0 && password.value !== confirmPassword.value);

const passwordRules = computed(() => ({
  length: password.value.length >= 8,
  upper: /[A-Z]/.test(password.value),
  lower: /[a-z]/.test(password.value),
  number: /[0-9]/.test(password.value),
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password.value),
}));

const passwordChecklist = computed(() => {
  const rules = passwordRules.value;
  return [
    { met: rules.length, label: 'At least 8 characters' },
    { met: rules.upper, label: 'One uppercase letter' },
    { met: rules.lower, label: 'One lowercase letter' },
    { met: rules.number, label: 'One number' },
    { met: rules.special, label: 'One special character' },
  ];
});

const passwordValid = computed(() => Object.values(passwordRules.value).every(Boolean));

const canSubmit = computed(() =>
  fullName.value.trim().length > 1 &&
  email.value.trim().length > 3 &&
  (!phoneRequired.value || phone.value.trim().length > 0) &&
  passwordValid.value &&
  password.value === confirmPassword.value &&
  !store.busy
);

function selectRole(value) {
  if (roleLocked.value) return;
  role.value = value;
}

async function submit() {
  if (!canSubmit.value) return;
  const accountEmail = email.value.trim().toLowerCase();
  const accountPassword = password.value;
  const command = new SignUpCommand({
    email: accountEmail,
    password: accountPassword,
    role: role.value,
    fullName: fullName.value.trim(),
    phone: phone.value.trim(),
    referralCode: referralCode.value.trim() || null
  });
  const result = await store.signUp(command);
  if (!result.success) return;

  const plan = selectedPlan.value;
  if (!plan) {
    submitted.value = true;
    return;
  }

  redirecting.value = true;
  const signInResult = await store.signIn(new SignInCommand({ email: accountEmail, password: accountPassword }));
  if (!signInResult.success) {
    redirecting.value = false;
    return;
  }
  subscriptionStore.startCheckout(plan, selectedInterval, () => { redirecting.value = false; });
}

function resend() {
  store.resendVerification(email.value);
}
</script>

<template>
  <section class="auth-shell register-shell">
    <div class="register-backdrop" aria-hidden="true">
      <img src="/assets/images/onboarding/carrusel_1.png" alt="" class="register-backdrop-slide" />
      <div class="register-backdrop-tint"></div>
    </div>

    <div class="register-stage" :class="{ 'register-stage--success': submitted }">
      <aside v-if="!submitted" class="register-story" aria-label="Viora account types">
        <div class="register-story-brand">
          <img src="/assets/brand/viora-isotipo-svg-white.svg" alt="" />
          <strong>Viora</strong>
        </div>

        <div class="register-character-wrap" aria-hidden="true">
          <div class="register-character-card is-producer" :class="{ 'is-active': role === 'ROLE_GROWER' }">
            <img src="/assets/images/general/olive-producer-character.png" alt="" />
            <span>Producer</span>
          </div>
          <div class="register-character-card is-specialist" :class="{ 'is-active': role === 'ROLE_SPECIALIST' }">
            <img src="/assets/images/general/phytosanitary-specialist-character.png" alt="" />
            <span>Specialist</span>
          </div>
        </div>

        <div class="register-story-copy">
          <span class="login-story-eyebrow">Built for the field</span>
          <h2>One account, two ways to help groves thrive</h2>
          <p>Producers track their own plots. Specialists assist producers with expert field visits.</p>
        </div>
      </aside>

    <template v-if="!submitted">
      <form class="auth-card auth-form register-card" @submit.prevent="submit">
        <div class="auth-brand">
          <img src="/assets/brand/viora-isotipo-svg.svg" alt="Viora" />
          <strong>Viora</strong>
        </div>

        <h1 class="auth-title">Create your account</h1>
        <p class="auth-subtitle">Join Viora to monitor groves or assist producers in the field.</p>

        <p v-if="store.error" class="auth-error">&#x26A0; {{ store.error }}</p>
        <p v-if="subscriptionStore.error" class="auth-error">&#x26A0; {{ subscriptionStore.error }}</p>

        <p v-if="selectedPlan" class="plan-banner">
          <i class="pi pi-verified"></i> Selected plan: <strong>{{ selectedPlan }}</strong>
        </p>

        <div class="role-grid" :class="{ 'is-locked': roleLocked }">
          <button
            type="button"
            class="role-card is-producer"
            :class="{ 'is-active': role === 'ROLE_GROWER' }"
            :disabled="roleLocked"
            @click="selectRole('ROLE_GROWER')"
          >
            <span class="role-visual">
              <img src="/assets/images/general/olive-producer-character-2.png" alt="" />
            </span>
            <strong>Producer</strong>
            <span>Monitor plots, IoT devices and alerts</span>
          </button>
          <button
            type="button"
            class="role-card is-specialist"
            :class="{ 'is-active': role === 'ROLE_SPECIALIST' }"
            :disabled="roleLocked"
            @click="selectRole('ROLE_SPECIALIST')"
          >
            <span class="role-visual">
              <img src="/assets/images/general/phytosanitary-specialist-character-2.png" alt="" />
            </span>
            <strong>Specialist</strong>
            <span>Assist producers with field expertise</span>
          </button>
        </div>

        <label class="field">
          <span>Full name</span>
          <input type="text" autocomplete="name" placeholder="e.g. Maria Torres" v-model="fullName" />
        </label>

        <label class="field">
          <span>Phone number</span>
          <input type="tel" autocomplete="tel" placeholder="Required for specialists" v-model="phone" />
          <span v-if="phoneMissing" class="field-hint" style="color: #d63b3b">Phone number is required for specialist accounts.</span>
        </label>

        <label class="field">
          <span>Email</span>
          <input type="email" autocomplete="email" placeholder="you@yourfarm.com" v-model="email" />
        </label>

        <label class="field">
          <span>Password</span>
          <input type="password" autocomplete="new-password" placeholder="At least 8 characters" v-model="password" />
        </label>

        <ul v-if="password.length > 0" class="pwd-rules" aria-live="polite">
          <li v-for="rule in passwordChecklist" :key="rule.label" :class="{ 'is-met': rule.met }">
            <i :class="rule.met ? 'pi pi-check-circle' : 'pi pi-circle'" aria-hidden="true"></i>
            {{ rule.label }}
          </li>
        </ul>

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

        <button type="submit" class="auth-submit" :disabled="!canSubmit || redirecting">
          {{ redirecting ? 'Redirecting to payment\u2026' : (store.busy ? 'Creating account\u2026' : (selectedPlan ? 'Create account and continue' : 'Create account')) }}
        </button>

        <p class="auth-foot">Already have an account? <router-link to="/login">Sign in</router-link></p>
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
        <p class="auth-foot">Verified already? <router-link to="/login">Sign in</router-link></p>
      </div>
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

.register-shell {
  position: relative;
  padding: 32px;
  overflow: hidden;
  background: #1f2523;
}

/* Blurred backdrop behind the split card, for visual consistency with the
   redesigned login screen — same treatment, static image (register has no
   carousel to drive it). */
.register-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.register-backdrop-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.12);
  filter: blur(26px) saturate(1.05);
}

.register-backdrop-tint {
  position: absolute;
  inset: 0;
  background: rgba(20, 28, 24, 0.28);
}

.register-stage {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1220px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 520px);
  align-items: stretch;
  border-radius: 30px;
  overflow: hidden;
  background: #f7f3ec;
  box-shadow: 0 40px 90px rgba(15, 22, 18, 0.45);
}

.register-stage--success {
  grid-template-columns: 1fr;
  place-items: center;
  padding: 24px;
}

.register-stage--success .auth-card { width: min(460px, 100%); }

.register-story {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  padding: 40px;
  background: linear-gradient(160deg, #2e4a3a 0%, #1f2523 100%);
  color: #fff;
  /* Thin frame so the panel reads as a "window" joined to the card, matching login. */
  border: 5px solid #f7f3ec;
  border-radius: 26px;
}

.register-story-brand { display: flex; align-items: center; gap: 10px; }
.register-story-brand img { width: 32px; height: 32px; }
.register-story-brand strong { font-size: 18px; font-weight: 600; color: #fff; }

.register-character-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.register-character-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: 0.55;
  transform: scale(0.94);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.register-character-card img {
  width: 140px;
  height: auto;
  filter: drop-shadow(0 12px 26px rgba(0, 0, 0, 0.35));
}

.register-character-card span {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.85);
}

.register-character-card.is-active {
  opacity: 1;
  transform: scale(1);
}

.register-story-copy { display: flex; flex-direction: column; gap: 10px; max-width: 440px; }
.register-story-copy h2 { margin: 0; font-size: 24px; font-weight: 600; line-height: 1.3; }
.register-story-copy p { margin: 0; font-size: 14px; font-weight: 400; line-height: 1.55; color: rgba(255, 255, 255, 0.82); }

.login-story-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a7e0c4;
}

.register-card {
  border-radius: 0;
  box-shadow: none;
  padding: 44px;
  justify-content: center;
  overflow-y: auto;
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

.plan-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(46, 74, 58, 0.08);
  color: #2e4a3a;
  font-size: 13px;
  font-weight: 500;
}

.role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.role-grid.is-locked .role-card:not(.is-active) { opacity: 0.5; }
.role-card:disabled { cursor: not-allowed; }

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

.role-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
}

.role-visual img {
  height: 100%;
  width: auto;
  object-fit: contain;
  filter: grayscale(0.4) opacity(0.75);
  transition: filter 0.15s ease;
}

.role-card strong { font-size: 14px; font-weight: 600; color: #333; }
.role-card span { font-size: 11px; font-weight: 400; color: #828282; text-align: center; line-height: 1.35; }

.role-card.is-active {
  border-color: #2e4a3a;
  background: #f0f7f4;
}

.role-card.is-active .role-visual img { filter: none; }
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

.pwd-rules {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
  margin: -4px 0 0;
  padding: 0;
  list-style: none;
}

.pwd-rules li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8a827a;
  transition: color 0.15s ease;
}

.pwd-rules li.is-met { color: #2e7d55; }

.pwd-rules i {
  font-size: 15px;
  color: #c2bbb0;
  transition: color 0.15s ease;
}

.pwd-rules li.is-met i { color: #2e7d55; }

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

@media (max-width: 960px) {
  .register-shell { padding: 16px; }
  .register-stage { grid-template-columns: 1fr; min-height: auto; }
  .register-story { display: none; }
  .register-card { padding: 32px 22px; }
}
</style>
