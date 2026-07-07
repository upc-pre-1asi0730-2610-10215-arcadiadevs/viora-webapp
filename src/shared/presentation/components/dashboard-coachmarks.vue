<script setup>
/**
 * DashboardCoachmarks — role-aware tour overlay that highlights dashboard cards
 * sequentially. Producer tour: overall health, NDVI, chill, yield, plot overview.
 * Specialist tour: resolved, acceptance, phyto, zonal radar, incoming requests.
 *
 * Translates the Angular DashboardCoachmarks to Vue 3 composition API.
 * Uses data-onboarding-target attributes on host cards for spotlight positioning.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '../../../iam/application/iam.store.js';
import { useOnboardingStore } from '../../application/onboarding.store.js';

const { t } = useI18n();
const iamStore = useIamStore();
const onboardingStore = useOnboardingStore();

const isSpecialist = computed(() => iamStore.isSpecialist);

/** @type {{ target: string, titleKey: string, descriptionKey: string }[]} */
const producerSteps = [
  { target: 'overall-health', titleKey: 'dashboardCoachmarks.steps.overall.title', descriptionKey: 'dashboardCoachmarks.steps.overall.description' },
  { target: 'ndvi-status', titleKey: 'dashboardCoachmarks.steps.ndvi.title', descriptionKey: 'dashboardCoachmarks.steps.ndvi.description' },
  { target: 'chill-accumulation', titleKey: 'dashboardCoachmarks.steps.chill.title', descriptionKey: 'dashboardCoachmarks.steps.chill.description' },
  { target: 'yield-forecast', titleKey: 'dashboardCoachmarks.steps.yield.title', descriptionKey: 'dashboardCoachmarks.steps.yield.description' },
  { target: 'plot-overview', titleKey: 'dashboardCoachmarks.steps.plotOverview.title', descriptionKey: 'dashboardCoachmarks.steps.plotOverview.description' },
];

const specialistSteps = [
  { target: 'sp-resolved', titleKey: 'dashboardCoachmarks.steps.spResolved.title', descriptionKey: 'dashboardCoachmarks.steps.spResolved.description' },
  { target: 'sp-acceptance', titleKey: 'dashboardCoachmarks.steps.spAcceptance.title', descriptionKey: 'dashboardCoachmarks.steps.spAcceptance.description' },
  { target: 'sp-phyto', titleKey: 'dashboardCoachmarks.steps.spPhyto.title', descriptionKey: 'dashboardCoachmarks.steps.spPhyto.description' },
  { target: 'sp-zonal', titleKey: 'dashboardCoachmarks.steps.spZonal.title', descriptionKey: 'dashboardCoachmarks.steps.spZonal.description' },
  { target: 'sp-incoming', titleKey: 'dashboardCoachmarks.steps.spIncoming.title', descriptionKey: 'dashboardCoachmarks.steps.spIncoming.description' },
];

const steps = computed(() => (isSpecialist.value ? specialistSteps : producerSteps));

const dashboardStepId = computed(() => (isSpecialist.value ? 'sp-dashboard' : 'dashboard'));
const prerequisiteStepId = computed(() => (isSpecialist.value ? 'profile' : 'plot'));

const viewReady = ref(false);
const currentIndex = ref(0);

/** @type {import('vue').Ref<{ top: number, left: number, width: number, height: number } | null>} */
const highlightRect = ref(null);
/** @type {import('vue').Ref<{ top: number, left: number }>} */
const tooltipPosition = ref({ top: 120, left: 280 });

const currentStep = computed(() => steps.value[currentIndex.value]);
const isLastStep = computed(() => currentIndex.value === steps.value.length - 1);
const progressLabel = computed(() => `${currentIndex.value + 1} / ${steps.value.length}`);

const active = computed(() =>
  viewReady.value &&
  onboardingStore.isCompleted(prerequisiteStepId.value) &&
  !onboardingStore.isCompleted(dashboardStepId.value),
);

let measureTimer = null;

function queueMeasure(shouldScroll) {
  if (measureTimer !== null) window.clearTimeout(measureTimer);
  measureTimer = window.setTimeout(() => {
    measureTarget(shouldScroll);
    measureTimer = null;
  }, 80);
}

function measureTarget(shouldScroll) {
  const target = document.querySelector(
    `[data-onboarding-target="${currentStep.value.target}"]`,
  );
  if (!target) {
    highlightRect.value = null;
    return;
  }

  if (shouldScroll) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    queueMeasure(false);
    return;
  }

  const padding = 8;
  const rect = target.getBoundingClientRect();
  highlightRect.value = {
    top: Math.max(12, rect.top - padding),
    left: Math.max(12, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
  tooltipPosition.value = getTooltipPosition(highlightRect.value);
}

function getTooltipPosition(rect) {
  const tooltipWidth = 332;
  const gap = 18;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const belowTop = rect.top + rect.height + gap;
  const aboveTop = rect.top - 220 - gap;
  const top = belowTop + 220 < viewportHeight ? belowTop : Math.max(18, aboveTop);
  const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  return {
    top,
    left: Math.min(Math.max(18, centeredLeft), viewportWidth - tooltipWidth - 18),
  };
}

function next() {
  if (isLastStep.value) {
    onboardingStore.complete(dashboardStepId.value);
    return;
  }
  currentIndex.value++;
  queueMeasure(true);
}

function previous() {
  if (currentIndex.value === 0) return;
  currentIndex.value--;
  queueMeasure(true);
}

function skip() {
  onboardingStore.complete(dashboardStepId.value);
}

function onViewportChange() {
  if (active.value) queueMeasure(false);
}

onMounted(() => {
  viewReady.value = true;
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('scroll', onViewportChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportChange);
  window.removeEventListener('scroll', onViewportChange);
  if (measureTimer !== null) window.clearTimeout(measureTimer);
});

watch(active, (isActive) => {
  if (isActive) queueMeasure(true);
});
</script>

<template>
  <Teleport to="body">
    <section v-if="active && highlightRect" class="coachmark-layer" aria-live="polite">
      <!-- Spotlight ring -->
      <div
        class="spotlight-ring"
        :style="{
          top: `${highlightRect.top}px`,
          left: `${highlightRect.left}px`,
          width: `${highlightRect.width}px`,
          height: `${highlightRect.height}px`,
        }"
      ></div>

      <!-- Tooltip card -->
      <article
        class="coachmark-card"
        :style="{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }"
      >
        <div class="coachmark-pointer" aria-hidden="true"></div>

        <header>
          <span>{{ progressLabel }}</span>
          <button
            type="button"
            class="cm-icon-button"
            :aria-label="t('dashboardCoachmarks.actions.skip')"
            @click="skip"
          >
            <i class="pi pi-times"></i>
          </button>
        </header>

        <h2>{{ t(currentStep.titleKey) }}</h2>
        <p>{{ t(currentStep.descriptionKey) }}</p>

        <footer>
          <button
            type="button"
            class="cm-text-button"
            :disabled="currentIndex === 0"
            @click="previous"
          >
            {{ t('dashboardCoachmarks.actions.back') }}
          </button>

          <div class="dots" aria-hidden="true">
            <span
              v-for="(step, idx) in steps"
              :key="step.target"
              :class="{ 'is-active': idx === currentIndex }"
            ></span>
          </div>

          <button type="button" class="cm-primary-button" @click="next">
            {{ isLastStep ? t('dashboardCoachmarks.actions.done') : t('dashboardCoachmarks.actions.next') }}
          </button>
        </footer>
      </article>
    </section>
  </Teleport>
</template>

<style scoped>
.coachmark-layer {
  position: fixed;
  inset: 0;
  z-index: 230;
  pointer-events: none;
  --cm-accent: #214a38;
  font-family: 'Poppins', sans-serif;
}

.coachmark-layer :deep(.coachmark-card) {
  /* specialist accent override applied via prop-less class on the root */
}

.spotlight-ring {
  position: fixed;
  box-sizing: border-box;
  border: 3px solid var(--cm-accent);
  border-radius: 18px;
  background: transparent;
  box-shadow:
    0 0 0 9999px rgba(22, 27, 24, 0.48),
    0 18px 44px rgba(20, 29, 24, 0.22);
  transition: top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease;
}

.coachmark-card {
  position: fixed;
  width: 332px;
  box-sizing: border-box;
  padding: 20px;
  border-radius: 16px;
  background: var(--cm-accent);
  color: #ffffff;
  box-shadow: 0 22px 52px rgba(20, 29, 24, 0.3);
  pointer-events: auto;
}

.coachmark-pointer {
  position: absolute;
  top: -9px;
  left: 38px;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: var(--cm-accent);
  transform: rotate(45deg);
}

header,
footer {
  display: flex;
  align-items: center;
}

header {
  justify-content: space-between;
  margin-bottom: 14px;
}

header > span {
  color: rgba(255, 255, 255, 0.74);
  font-size: 12px;
  font-weight: 700;
}

h2 {
  margin: 0;
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
}

p {
  margin: 9px 0 18px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
}

footer {
  justify-content: space-between;
  gap: 14px;
}

.cm-icon-button,
.cm-text-button,
.cm-primary-button {
  font-family: inherit;
  cursor: pointer;
}

.cm-icon-button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.cm-icon-button:hover {
  background: rgba(255, 255, 255, 0.16);
}

.cm-icon-button i {
  font-size: 16px;
}

.cm-text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 700;
}

.cm-text-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.cm-primary-button {
  min-width: 72px;
  min-height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: var(--cm-accent);
  font-size: 13px;
  font-weight: 800;
}

.cm-primary-button:hover {
  background: #f4f0e8;
}

.dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dots span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.36);
}

.dots span.is-active {
  width: 16px;
  background: #ffffff;
}

@media (max-width: 620px) {
  .coachmark-card {
    right: 16px;
    left: 16px !important;
    width: auto;
  }
}
</style>
