<script setup>
/**
 * SummaryBaseCard component.
 * A generic card for displaying metrics with a value, icon, and status pill.
 *
 * @component
 */
defineProps({
  /**
   * Title of the metric card.
   */
  title: { type: String, required: true },
  /**
   * Main numerical or textual value to display.
   */
  valueText: { type: String, required: true },
  /**
   * PrimeIcons class name for the metric icon.
   */
  iconClass: { type: String, required: true },
  /**
   * Label for the status indicator pill.
   */
  statusLabel: { type: String, required: true },
  /**
   * Progress percentage (0-100). If null, a static divider is shown instead.
   */
  progress: { type: Number, default: null },
  /**
   * Background color for the status pill.
   */
  badgeColor: { type: String, required: true },
  /**
   * Color for the icon and progress bar.
   */
  accentColor: { type: String, required: true },
  /**
   * Optional descriptive text for the footer.
   */
  footerText: { type: String, default: '' }
});
</script>

<template>
  <pv-card class="custom-summary-card">
    <template #content>
      <div class="card-internal-wrapper">
        <div class="upper-content">
          <h3 class="title-text">{{ title }}</h3>

          <div class="value-container">
            <span class="main-value">{{ valueText }}</span>

            <div v-if="iconClass && iconClass.trim() !== ''" class="icon-wrapper">
              <i
                  :class="['pi', iconClass, 'metric-icon']"
                  :style="{ color: accentColor }"
              ></i>
            </div>
          </div>

          <div
              class="status-pill-full"
              :style="{ backgroundColor: badgeColor }"
          >
            {{ statusLabel }}
          </div>
        </div>

        <div class="flex-grow"></div>

        <div class="bottom-content w-full">
          <div class="bar-area">
            <pv-progress-bar
                v-if="progress !== null && progress >= 0"
                :value="progress"
                :show-value="false"
                class="custom-bar"
                :style="{'--accent-color': accentColor}"
            />
            <div
                v-else
                class="static-invisible-bar"
            ></div>
          </div>

          <div v-if="footerText" class="footer-section">
            <p class="footer-text">{{ footerText }}</p>
          </div>
        </div>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400&family=Poppins:wght@400;500;600&display=swap');
@import url('https://unpkg.com/primeicons/primeicons.css');

.custom-summary-card {
  width: 100%;
  max-width: 240px;
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

.upper-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.title-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #1C1D21;
  margin: 0 0 6px 0;
  width: 100%;
  text-align: left;
}

.value-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;
}

.main-value {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 32px;
  line-height: 1;
  color: #1C1D21;
}

.metric-icon {
  font-size: 20px !important;
  font-family: 'primeicons' !important;
  display: inline-block;
  line-height: 1;
}

.status-pill-full {
  width: 100%;
  color: #FFFFFF;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  padding: 6px 0;
  border-radius: 100px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.flex-grow { flex-grow: 1; }

.bar-area {
  width: 100%;
  margin-bottom: 7px;
}

.static-invisible-bar {
  width: 100%;
  height: 8px;
  background-color: transparent;
  border-top: 1px solid #EBEBF0;
}

.footer-section { width: 100%; }

.footer-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 11px;
  line-height: 1.2;
  color: #8C877F;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.custom-bar) {
  height: 8px !important;
  background-color: #F5F5FA !important;
  border-radius: 4px;
  border: none;
}

:deep(.custom-bar .p-progressbar-value) {
  background-color: var(--accent-color) !important;
  border-radius: 4px;
}
</style>