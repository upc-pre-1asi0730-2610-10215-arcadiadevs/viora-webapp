<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SummaryBaseCard from "./summary-base-card.vue";

const { t } = useI18n();

const props = defineProps({
  /** Raw NDVI value from the API/Store (e.g., 0.6842) */
  value: { type: Number, required: true },
  /** Trend state: 'up' or 'down' */
  trend: { type: String, required: true },
  /** Status description label */
  statusLabel: { type: String, required: true }
});

/**
 * Transforms the trend string into a PrimeIcons class.
 */
const trendIcon = computed(() => {
  return props.trend === 'down' ? 'pi-arrow-down' : 'pi-arrow-up';
});

/**
 * Formats the decimal value into a percentage for the progress bar.
 */
const progressValue = computed(() => Math.round(props.value * 100));

/**
 * Formats the number to exactly 2 decimal places for display.
 */
const formattedValue = computed(() => props.value.toFixed(2));
</script>

<template>
  <SummaryBaseCard
      :title="t('dashboard.ndvi-status-title')"
      :valueText="formattedValue"
      :iconClass="trendIcon"
      :statusLabel="statusLabel"
      :progress="progressValue"
      badgeColor="#1F2C26"
      accentColor="#2E4A3A"
  />
</template>