<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SummaryBaseCard from "./summary-base-card.vue";

const { t } = useI18n();

/**
 * ChillAccumulationCard component.
 * Specialized wrapper for SummaryBaseCard, handling thermal accumulation logic.
 * Context: Agronomic
 */
const props = defineProps({
  /** Accumulated Chill Portions (CP) units from the API/Store */
  value: { type: Number, required: true },
  /** Weekly difference value (can be negative, e.g., -2 or 6) */
  weeklyDiff: { type: Number, required: true },
  /** Threshold for progress calculation (defaults to 600) */
  threshold: { type: Number, default: 600 }
});

/**
 * Formats numeric CP value for display text.
 */
const formattedValue = computed(() => `${props.value} CP`);

/**
 * Constructs the status label showing weekly increment or decrement.
 * Dynamically handles signs to avoid duplicated indicators (+-6).
 */
const formattedStatus = computed(() => {
  const sign = props.weeklyDiff >= 0 ? '+' : '';
  return `${sign}${props.weeklyDiff} ${t('dashboard.from-last-week')}`;
});

/**
 * Calculates percentage against target threshold.
 */
const progressValue = computed(() => Math.round((props.value / props.threshold) * 100));
</script>

<template>
  <SummaryBaseCard
      :title="t('dashboard.chill-hours-title')"
      :value-text="formattedValue"
      icon-class=""
      :statusLabel="formattedStatus"
      :progress="progressValue"
      badgeColor="#5B8DEF"
      accentColor="#0063F7"
  />
</template>