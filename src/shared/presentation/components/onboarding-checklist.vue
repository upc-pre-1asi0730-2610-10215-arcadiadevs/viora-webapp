<script setup>
/**
 * OnboardingChecklist — floating role-aware checklist widget.
 * Producer: plot → dashboard → expert assistance.
 * Specialist: profile → dashboard → marketplace.
 *
 * Translates the Angular OnboardingChecklist to Vue 3 composition API.
 */
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useIamStore } from '../../../iam/application/iam.store.js';
import { useOnboardingStore } from '../../application/onboarding.store.js';
import { useAgronomicStore } from '../../../agronomic/application/agronomic.store.js';
import { useProfileStore } from '../../../profile/application/profile.store.js';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const iamStore = useIamStore();
const onboardingStore = useOnboardingStore();
const agronomicStore = useAgronomicStore();
const profileStore = useProfileStore();

const isSpecialist = computed(() => iamStore.isSpecialist);
const totalSteps = 3;

// --- Plot detection (producers) ---
// Check if the producer has registered at least one plot.
// Primary source: onboarding store completion flag.
// Fallback: agronomic store plots list (if loaded and non-empty).
const hasRegisteredPlot = computed(() => {
  if (onboardingStore.isCompleted('plot')) return true;
  // Fallback to agronomic store: if plots are loaded and at least one exists
  return agronomicStore.plotsLoaded && agronomicStore.plots.length > 0;
});

// --- Specialist profile detection ---
// Check if the specialist has completed their profile (service tags + location).
// Primary source: onboarding store completion flag.
// Fallback: profile store has both location and service tags set.
const hasSpecialistProfile = computed(() => {
  if (onboardingStore.isCompleted('profile')) return true;
  // Fallback to profile store: check if both location and service tags are set
  const profile = profileStore.profile;
  return !!(profile.location && profile.location.trim() && profile.serviceTags && profile.serviceTags.trim());
});

function buildProducerSteps() {
  const plotCompleted = hasRegisteredPlot.value;
  const dashboardCompleted = onboardingStore.isCompleted('dashboard');
  const expertCompleted = onboardingStore.isCompleted('expert');
  return [
    {
      id: 'plot',
      route: '/agronomic/plots/new',
      icon: 'pi pi-map-marker',
      titleKey: 'onboardingChecklist.steps.plot.title',
      descriptionKey: 'onboardingChecklist.steps.plot.description',
      completed: plotCompleted,
      unlocked: true,
    },
    {
      id: 'dashboard',
      route: '/dashboard',
      icon: 'pi pi-th-large',
      titleKey: 'onboardingChecklist.steps.dashboard.title',
      descriptionKey: 'onboardingChecklist.steps.dashboard.description',
      completed: dashboardCompleted,
      unlocked: plotCompleted,
    },
    {
      id: 'expert',
      route: '/assistance/expert-assistance',
      icon: 'pi pi-headphones',
      titleKey: 'onboardingChecklist.steps.expert.title',
      descriptionKey: 'onboardingChecklist.steps.expert.description',
      completed: expertCompleted,
      unlocked: plotCompleted && dashboardCompleted,
    },
  ];
}

function buildSpecialistSteps() {
  const profileCompleted = hasSpecialistProfile.value;
  const dashboardCompleted = onboardingStore.isCompleted('sp-dashboard');
  const marketplaceCompleted = onboardingStore.isCompleted('marketplace');
  return [
    {
      id: 'profile',
      route: '/settings',
      icon: 'pi pi-id-card',
      titleKey: 'onboardingChecklist.steps.profile.title',
      descriptionKey: 'onboardingChecklist.steps.profile.description',
      completed: profileCompleted,
      unlocked: true,
    },
    {
      id: 'sp-dashboard',
      route: '/dashboard',
      icon: 'pi pi-th-large',
      titleKey: 'onboardingChecklist.steps.spDashboard.title',
      descriptionKey: 'onboardingChecklist.steps.spDashboard.description',
      completed: dashboardCompleted,
      unlocked: profileCompleted,
    },
    {
      id: 'marketplace',
      route: '/specialist/marketplace',
      icon: 'pi pi-shopping-bag',
      titleKey: 'onboardingChecklist.steps.marketplace.title',
      descriptionKey: 'onboardingChecklist.steps.marketplace.description',
      completed: marketplaceCompleted,
      unlocked: profileCompleted && dashboardCompleted,
    },
  ];
}

const steps = computed(() => (isSpecialist.value ? buildSpecialistSteps() : buildProducerSteps()));
const completedCount = computed(() => steps.value.filter((s) => s.completed).length);
const progressPercent = computed(() => (completedCount.value / totalSteps) * 100);
const allDone = computed(() => completedCount.value === totalSteps);

const visible = computed(
  () => !onboardingStore.minimized && !onboardingStore.dismissed,
);
const showLauncher = computed(
  () => (onboardingStore.minimized || onboardingStore.dismissed) && !allDone.value,
);
const nextStep = computed(() => steps.value.find((s) => !s.completed) ?? null);
const primaryActionKey = computed(() =>
  allDone.value ? 'onboardingChecklist.actions.finish' : 'onboardingChecklist.actions.continue',
);

function normalizedPath() {
  return (route.path || '').split('?')[0].split('#')[0];
}

// --- Auto-complete logic (mirrors Angular effect) ---
function autoCompleteSteps() {
  const url = normalizedPath();
  if (isSpecialist.value) {
    if (hasSpecialistProfile.value) {
      onboardingStore.complete('profile');
    }
    if (
      onboardingStore.isCompleted('profile') &&
      onboardingStore.isCompleted('sp-dashboard') &&
      url.startsWith('/specialist/marketplace')
    ) {
      onboardingStore.complete('marketplace');
    }
    return;
  }

  if (hasRegisteredPlot.value) {
    onboardingStore.complete('plot');
  }
  if (
    hasRegisteredPlot.value &&
    onboardingStore.isCompleted('dashboard') &&
    url.startsWith('/assistance/expert-assistance')
  ) {
    onboardingStore.complete('expert');
  }
}

watch(() => route.path, autoCompleteSteps);
onMounted(autoCompleteSteps);

function openNextStep() {
  if (allDone.value) {
    onboardingStore.dismiss();
    return;
  }
  const step = nextStep.value;
  if (step) openStep(step);
}

function openStep(step) {
  if (!step.unlocked) return;
  router.push(step.route);
}

function minimize() {
  onboardingStore.setMinimized(true);
}

function reopen() {
  onboardingStore.reopen();
}

function stepIndex(stepId) {
  return steps.value.findIndex((s) => s.id === stepId) + 1;
}
</script>

<template>
  <!-- Full checklist card -->
  <section v-if="visible" class="onboarding-card" :class="{ 'is-complete': allDone }" aria-live="polite">
    <header class="onboarding-header">
      <div>
        <p class="eyebrow">{{ t('onboardingChecklist.eyebrow') }}</p>
        <h2>{{ t('onboardingChecklist.title') }}</h2>
      </div>
      <button
        type="button"
        class="ob-icon-button"
        :aria-label="t('onboardingChecklist.actions.minimize')"
        :title="t('onboardingChecklist.actions.minimize')"
        @click="minimize"
      >
        <i class="pi pi-times"></i>
      </button>
    </header>

    <div class="progress-row">
      <div class="progress-track" aria-hidden="true">
        <span :style="{ width: `${progressPercent}%` }"></span>
      </div>
      <span class="progress-label">
        {{ t('onboardingChecklist.progress', { done: completedCount, total: totalSteps }) }}
      </span>
    </div>

    <ol class="step-list">
      <li v-for="step in steps" :key="step.id">
        <button
          type="button"
          class="step-button"
          :class="{ 'is-complete': step.completed, 'is-active': nextStep?.id === step.id }"
          :disabled="!step.unlocked"
          @click="openStep(step)"
        >
          <span class="step-marker">
            <i v-if="step.completed" class="pi pi-check"></i>
            <template v-else>{{ stepIndex(step.id) }}</template>
          </span>

          <span class="step-copy">
            <strong>{{ t(step.titleKey) }}</strong>
            <span>{{ t(step.descriptionKey) }}</span>
          </span>

          <i class="pi pi-chevron-right step-arrow"></i>
        </button>
      </li>
    </ol>

    <button type="button" class="primary-action" @click="openNextStep">
      <i v-if="allDone" class="pi pi-check-circle"></i>
      <i v-else :class="nextStep?.icon ?? 'pi pi-arrow-right'"></i>
      <span>{{ t(primaryActionKey) }}</span>
    </button>
  </section>

  <!-- Minimized launcher pill -->
  <button
    v-else-if="showLauncher"
    type="button"
    class="onboarding-launcher"
    :aria-label="t('onboardingChecklist.actions.open')"
    @click="reopen"
  >
    <i class="pi pi-check-circle"></i>
    <span>{{ t('onboardingChecklist.launcher', { done: completedCount, total: totalSteps }) }}</span>
  </button>
</template>

<style scoped>
.onboarding-card,
.onboarding-launcher {
  position: fixed;
  right: 28px;
  bottom: 24px;
  z-index: 140;
  font-family: 'Poppins', sans-serif;
  --ob-accent: #214a38;
  --ob-accent-strong: #173629;
}

.onboarding-card {
  width: min(360px, calc(100vw - 56px));
  padding: 22px;
  border: 1px solid rgba(46, 74, 58, 0.08);
  border-radius: 18px;
  background: #ffffff;
  color: #17211c;
  box-shadow: 0 22px 56px rgba(31, 37, 35, 0.18);
}

.onboarding-card.is-complete {
  border-color: rgba(46, 74, 58, 0.18);
}

.onboarding-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #8a9c92;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: #101815;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.ob-icon-button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #7d8d84;
  cursor: pointer;
}

.ob-icon-button:hover {
  background: #f4f0e8;
  color: #17211c;
}

.ob-icon-button i {
  font-size: 16px;
}

.progress-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #eee6d8;
}

.progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ob-accent);
  transition: width 180ms ease;
}

.progress-label {
  color: #7d8d84;
  font-size: 12px;
  font-weight: 600;
}

.step-list {
  display: grid;
  gap: 8px;
  margin: 18px 0;
  padding: 0;
  list-style: none;
}

.step-button {
  width: 100%;
  min-height: 74px;
  display: grid;
  grid-template-columns: 32px 1fr 20px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.step-button:hover:not(:disabled),
.step-button.is-active {
  background: #f7f2ea;
  border-color: rgba(46, 74, 58, 0.08);
}

.step-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.step-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.step-marker {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid #cfd8d1;
  border-radius: 999px;
  color: #506158;
  font-size: 13px;
  font-weight: 700;
}

.step-button.is-complete .step-marker {
  border-color: var(--ob-accent);
  background: var(--ob-accent);
  color: #ffffff;
}

.step-marker i {
  font-size: 14px;
}

.step-copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.step-copy strong {
  color: #121a16;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
}

.step-copy > span {
  color: #718177;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
}

.step-arrow {
  color: #7d8d84;
  font-size: 18px;
}

.primary-action,
.onboarding-launcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: var(--ob-accent);
  color: #ffffff;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(33, 74, 56, 0.18);
}

.primary-action {
  width: 100%;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 13px;
  font-size: 14px;
}

.primary-action:hover,
.onboarding-launcher:hover {
  background: var(--ob-accent-strong);
}

.primary-action i,
.onboarding-launcher i {
  font-size: 18px;
}

.onboarding-launcher {
  position: fixed;
  right: 28px;
  bottom: 24px;
  z-index: 140;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .onboarding-card,
  .onboarding-launcher {
    right: 16px;
    bottom: 16px;
    left: 96px;
  }

  .onboarding-card {
    width: 100%;
  }
}

@media (max-width: 620px) {
  .onboarding-card,
  .onboarding-launcher {
    left: 90px;
  }

  .onboarding-card {
    padding: 18px;
  }

  .step-button {
    grid-template-columns: 30px 1fr;
  }

  .step-arrow {
    display: none;
  }
}
</style>
