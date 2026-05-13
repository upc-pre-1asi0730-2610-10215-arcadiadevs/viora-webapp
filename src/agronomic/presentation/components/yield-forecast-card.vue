<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SummaryBaseCard from "../../../agronomic/presentation/components/summary-base-card.vue";

const { t } = useI18n();

/**
 * YieldForecastCard component.
 * Specialized wrapper for SummaryBaseCard, focusing on harvest prediction
 * and alternate bearing risk assessment.
 * Context: Agronomic
 */
const props = defineProps({
  /** Forecasted tonnage value (e.g., 12.4) */
  tonnes: { type: Number, required: true },
  /** Risk classification level (e.g., 'Medium', 'High', 'Low') */
  riskLevel: { type: String, required: true }
});

/**
 * Formats the tonnage with the unit 't' for display.
 */
const formattedValue = computed(() => `${props.tonnes} t`);

/**
 * Formats the footer text to display the specific risk assessment.
 */
const footerMessage = computed(() => `${t('dashboard.risk-alternate-bearing')}: ${props.riskLevel}`);
</script>

<template>
  <summary-base-card
      :title="t('dashboard.yield-forecast-title')"
      :value-text="formattedValue"
      icon-class=""
      :status-Label="riskLevel"
      :progress="null"
      badge-color="#C15A2E"
      accent-color="#C15A2E"
      :footer-text="footerMessage"
  />
</template>