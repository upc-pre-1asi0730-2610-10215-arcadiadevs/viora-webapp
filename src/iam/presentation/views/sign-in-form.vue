<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import { SignInCommand } from '../../domain/model/sign-in.command.js';

const router = useRouter();
const store = useIamStore();

const email = ref('');
const password = ref('');

const carouselSlides = [
  { src: '/assets/images/onboarding/carrusel_1.png', label: 'Satellite monitoring landscape' },
  { src: '/assets/images/onboarding/carrusel_2.png', label: 'Field observation detail' },
  { src: '/assets/images/onboarding/carrusel_3.png', label: 'Farm intervention planning' }
];
const activeSlide = ref(0);
const carouselDelayMs = 5000;
let carouselTimer = null;

function startCarousel() {
  carouselTimer = setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % carouselSlides.length;
  }, carouselDelayMs);
}

function stopCarousel() {
  if (carouselTimer !== null) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

function selectSlide(index) {
  activeSlide.value = index;
  stopCarousel();
  startCarousel();
}

onMounted(() => {
  store.clearMessages();
  startCarousel();
});

onUnmounted(() => {
  stopCarousel();
});

const canSubmit = () => email.value.trim().length > 3 && password.value.length >= 8 && !store.busy;

async function submit() {
  if (!canSubmit()) return;
  const command = new SignInCommand({ email: email.value, password: password.value });
  const result = await store.signIn(command);
  if (result.success) router.push(result.redirect ?? { name: 'dashboard' });
}

function resend() {
  if (email.value.trim()) {
    store.resendVerification(email.value);
  }
}
</script>

<template>
  <section class="auth-shell login-shell">
    <div class="login-stage">
      <aside class="login-story" aria-label="Viora monitoring highlights">
        <div class="login-story-slides" aria-hidden="true">
          <img
            v-for="(slide, index) in carouselSlides"
            :key="slide.src"
            :src="slide.src"
            alt=""
            class="login-story-slide"
            :class="{ 'is-active': activeSlide === index }"
          />
        </div>

        <div class="login-story-brand">
          <img src="/assets/icons/dashboard/viora-isotipo-white.png" alt="" />
          <strong>Viora</strong>
        </div>

        <div class="login-story-copy">
          <span class="login-story-eyebrow">Grove intelligence</span>
          <h2>See every plot, alert and intervention in one view</h2>
          <p>Track soil health, weather risk and field visits without leaving your dashboard.</p>
          <div class="login-story-dots" role="tablist" aria-label="Carousel images">
            <button
              v-for="(slide, index) in carouselSlides"
              :key="slide.src"
              type="button"
              class="login-story-dot"
              :class="{ 'is-active': activeSlide === index }"
              :aria-label="`Show ${slide.label}`"
              :aria-pressed="activeSlide === index"
              @click="selectSlide(index)"
            ></button>
          </div>
        </div>
      </aside>

      <form class="auth-card auth-form login-card" @submit.prevent="submit">
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

      <p class="auth-foot">New to Viora? <router-link to="/plans">Create an account</router-link></p>
      </form>
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

.login-shell { padding: 0; }

.login-stage {
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 460px);
  align-items: stretch;
}

.login-story {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 40px;
  overflow: hidden;
  background: #1f2523;
}

.login-story-slides {
  position: absolute;
  inset: 0;
}

.login-story-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.login-story-slide.is-active { opacity: 1; }

.login-story::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(31, 37, 35, 0.05) 0%, rgba(31, 37, 35, 0.75) 100%);
}

.login-story-brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: auto;
}

.login-story-brand img { width: 32px; height: 32px; }
.login-story-brand strong { font-size: 18px; font-weight: 600; color: #fff; }

.login-story-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
  color: #fff;
}

.login-story-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a7e0c4;
}

.login-story-copy h2 { margin: 0; font-size: 26px; font-weight: 600; line-height: 1.3; }
.login-story-copy p { margin: 0; font-size: 14px; font-weight: 400; line-height: 1.55; color: rgba(255, 255, 255, 0.82); }

.login-story-dots {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.login-story-dot {
  width: 24px;
  height: 4px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
}

.login-story-dot.is-active { background: #c15a2e; }

.login-card {
  border-radius: 0;
  box-shadow: none;
  justify-content: center;
  padding: 48px 44px;
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

@media (max-width: 960px) {
  .login-stage { grid-template-columns: 1fr; }
  .login-story { display: none; }
  .login-card { padding: 36px 24px; }
}
</style>
