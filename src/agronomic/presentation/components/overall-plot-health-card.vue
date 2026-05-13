<script setup>
/**
 * OverallPlotHealthCard component.
 * Displays a global summary of plot health status.
 *
 * @component
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  /** 
   * Localized status label (e.g., "Healthy", "Requires attention").
   */
  status: { type: String, required: true },
  /** 
   * Flag indicating if the overall health state is positive.
   */
  isHealthy: { type: Boolean, required: true },
  /** 
   * Count of plots currently in a healthy state.
   */
  healthyPlotsCount: { type: Number, required: true },
  /** 
   * Count of plots that require review.
   */
  reviewPlotsCount: { type: Number, required: true },
});

/** 
 * Summary message displaying the count of healthy vs. review plots.
 * @type {import('vue').ComputedRef<string>} 
 */
const footerMessage = computed(() => {
  return `${t('dashboard.plots-healthy', { count: props.healthyPlotsCount })} / ${t('dashboard.plots-under-review', { count: props.reviewPlotsCount })}`;
});

/** 
 * Tooltip explanation for health metrics.
 * @type {string} 
 */
const tooltipContent = t('dashboard.ndvi-risk-tooltip');
</script>

<template>
  <pv-card class="surveillance-health-card">
    <template #content>
      <div class="card-internal-wrapper">
        <div class="header-section">
          <h3 class="title-text">{{ t('dashboard.overall-plot-health-title') }}</h3>
          <p class="subtitle-text">{{ t('dashboard.status-subtitle') }}</p>
        </div>

        <div class="body-section">
          <div
              class="status-pill-left"
              :class="{ 'status-healthy': isHealthy, 'status-review': !isHealthy }"
          >
            {{ status }}
          </div>
        </div>

        <div class="flex-grow"></div>

        <div class="footer-area w-full">
          <div class="static-line-divider"></div>
          <div class="footer-content">
            <i
                class="pi pi-info-circle info-icon"
                v-tooltip.top="tooltipContent"
            ></i>
            <p class="footer-text">{{ footerMessage }}</p>
          </div>
        </div>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

.surveillance-health-card {
  width: 100%;
  max-width: 300px;
  height: 172px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  background-color: #ffffff;
}

:deep(.p-card-body), :deep(.p-card-content) {
  padding: 0 !important;
  height: 100%;
}

.card-internal-wrapper {
  display: flex;
  flex-direction: column;
  padding: 24px 20px 18px 20px;
  height: 100%;
  box-sizing: border-box;
}

.header-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.title-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
  color: #1C1D21;
  margin: 0;
}

.subtitle-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.2;
  color: #4F4F4F;
  margin: 9px 0 0 0;
}

.body-section {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-top: 12px;
}

.status-pill-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 131px;
  height: 25px;
  color: #1A2B24;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  border-radius: 99px;
  text-align: center;
  white-space: nowrap;
}

.status-healthy {
  background-color: #57EBA1;
}

.status-review {
  background-color: #FF8080;
}

.flex-grow { flex-grow: 1; }

.footer-area { width: 100%; }

.static-line-divider {
  width: 100%;
  height: 1px;
  background-color: #EBEBF0;
  margin-bottom: 7px;
}

.footer-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  font-size: 11px;
  color: #8C877F;
  cursor: pointer;
}

.footer-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 11px;
  color: #8C877F;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>