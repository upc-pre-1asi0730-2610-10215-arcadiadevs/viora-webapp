<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useIamStore from '../../application/iam.store.js';
import { SignInCommand } from '../../domain/model/sign-in.command.js';
import LanguageToggle from '../../../shared/presentation/components/language-toggle.vue';

const router = useRouter();
const store = useIamStore();
const { t } = useI18n();

const email = ref('');
const password = ref('');

const carouselSlides = [
  { src: '/assets/images/onboarding/carrusel_1.png', label: 'Satellite monitoring landscape', headlineKey: 'auth.login-headline-satellite' },
  { src: '/assets/images/onboarding/carrusel_2.png', label: 'Field observation detail', headlineKey: 'auth.login-headline-soil' },
  { src: '/assets/images/onboarding/carrusel_3.png', label: 'Farm intervention planning', headlineKey: 'auth.login-headline-intervention' }
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

// Typewriter headline: retypes the active slide's headline whenever the slide
// changes (auto-advance or dot click), with a blinking caret via CSS.
const typedHeadline = ref('');
const typeSpeedMs = 45;
const deleteSpeedMs = 22;
let typeTimer = null;

function clearTypeTimer() {
  if (typeTimer !== null) {
    clearTimeout(typeTimer);
    typeTimer = null;
  }
}

function typeIn(target) {
  let count = 0;
  const step = () => {
    count += 1;
    typedHeadline.value = target.slice(0, count);
    if (count < target.length) {
      typeTimer = setTimeout(step, typeSpeedMs);
    }
  };
  step();
}

function deleteAllThen(next) {
  const step = () => {
    const current = typedHeadline.value;
    if (current.length === 0) {
      next();
      return;
    }
    typedHeadline.value = current.slice(0, -1);
    typeTimer = setTimeout(step, deleteSpeedMs);
  };
  step();
}

watch(activeSlide, (index) => {
  clearTypeTimer();
  deleteAllThen(() => typeIn(t(carouselSlides[index].headlineKey)));
});

onMounted(() => {
  store.clearMessages();
  startCarousel();
  typeIn(t(carouselSlides[activeSlide.value].headlineKey));
  // The login is a fixed-height, full-viewport layout with a pinned backdrop,
  // so lock page scroll while it's shown (restored on leave).
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  stopCarousel();
  clearTypeTimer();
  document.body.style.overflow = '';
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
    <div class="login-backdrop" aria-hidden="true">
      <img
        v-for="(slide, index) in carouselSlides"
        :key="slide.src"
        :src="slide.src"
        alt=""
        class="login-backdrop-slide"
        :class="{ 'is-active': activeSlide === index }"
      />
      <div class="login-backdrop-tint"></div>
    </div>

    <LanguageToggle class="login-lang" />

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
          <img src="/assets/brand/viora-isotipo-svg-white.svg" alt="" />
          <strong>Viora</strong>
        </div>

        <div class="login-story-copy">
          <span class="login-story-eyebrow">Grove intelligence</span>
          <h2 class="login-story-headline" aria-live="polite">{{ typedHeadline }}<span class="login-caret" aria-hidden="true"></span></h2>
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
          <img src="/assets/brand/viora-isotipo-svg.svg" alt="Viora" />
          <strong>Viora</strong>
        </div>

        <h1 class="auth-title">{{ t('auth.login-title') }}</h1>
        <p class="auth-subtitle">{{ t('auth.login-subtitle') }}</p>

      <p v-if="store.error" class="auth-error">&#x26A0; {{ store.error }}</p>
      <p v-if="store.info" class="auth-info">&#x2714; {{ store.info }}</p>

      <label class="field">
        <span>{{ t('auth.email-label') }}</span>
        <input
          type="email"
          autocomplete="email"
          :placeholder="t('auth.email-placeholder')"
          v-model="email"
        />
      </label>

      <label class="field">
        <span>{{ t('auth.password-label') }}</span>
        <input
          type="password"
          autocomplete="current-password"
          :placeholder="t('auth.login-password-placeholder')"
          v-model="password"
        />
      </label>

      <button
        v-if="store.needsVerification"
        type="button"
        class="auth-link-button"
        @click="resend"
      >
        {{ t('auth.resend-verification') }}
      </button>

      <button type="submit" class="auth-submit" :disabled="!canSubmit()">
        {{ store.busy ? t('auth.signing-in') : t('auth.sign-in-button') }}
      </button>

      <p class="auth-foot">{{ t('auth.no-account-yet') }} <router-link to="/plans">{{ t('auth.create-account-link') }}</router-link></p>
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

.login-shell {
  position: relative;
  padding: 32px;
  overflow: hidden;
  background: #1f2523;
}

/* Blurred backdrop: the same active carousel slide, scaled up and blurred, with
   a dark tint so the crisp split-card floats over its own blurred backdrop. */
.login-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.login-backdrop-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.12);
  filter: blur(26px) saturate(1.05);
  opacity: 0;
  transition: opacity 1.1s ease;
}

.login-backdrop-slide.is-active { opacity: 1; }

.login-backdrop-tint {
  position: absolute;
  inset: 0;
  background: rgba(20, 28, 24, 0.28);
}

.login-lang {
  position: absolute;
  top: 22px;
  right: 24px;
  z-index: 2;
}

.login-stage {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 460px);
  align-items: stretch;
  border-radius: 30px;
  overflow: hidden;
  background: #f7f3ec;
  box-shadow: 0 40px 90px rgba(15, 22, 18, 0.45);
}

.login-story {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 40px;
  overflow: hidden;
  background: #1f2523;
  /* Thin frame so the crisp visual panel reads as a "window" joined to the card. */
  border: 5px solid #f7f3ec;
  border-radius: 26px;
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

.login-story-headline {
  margin: 0;
  /* Reserve space for ~2 lines so the card doesn't jump while retyping. */
  min-height: 2.6em;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
}

.login-caret {
  display: inline-block;
  width: 3px;
  height: 0.9em;
  margin-left: 4px;
  vertical-align: -0.05em;
  background: #a7e0c4;
  border-radius: 1px;
  animation: login-caret-blink 1s steps(1, end) infinite;
}

@keyframes login-caret-blink {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}

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
  .login-shell { padding: 16px; }
  .login-stage { grid-template-columns: 1fr; min-height: auto; }
  .login-story { display: none; }
  .login-card { padding: 36px 24px; }
}
</style>
