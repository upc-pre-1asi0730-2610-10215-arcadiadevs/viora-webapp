<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  sensor: {
    type: Object,
    required: true
  }
});

const { t } = useI18n();

const metricLabelKey = computed(() => {
  if (!props.sensor) return '';
  return props.sensor.metricLabel.toLowerCase().includes('temperature')
      ? 'cards.iot.soilTemperature'
      : 'cards.iot.soilMoisture';
});

const recommendationKey = computed(() => {
  if (!props.sensor) return '';
  const isTemp = props.sensor.metricLabel.toLowerCase().includes('temperature');

  if (isTemp) {
    if (props.sensor.riskLevel === 'High') return 'cards.iot.temperatureHigh';
    if (props.sensor.riskLevel === 'Medium') return 'cards.iot.temperatureMedium';
    return 'cards.iot.temperatureLow';
  }

  if (props.sensor.riskLevel === 'High') return 'cards.iot.moistureHigh';
  if (props.sensor.riskLevel === 'Medium') return 'cards.iot.moistureMedium';
  return 'cards.iot.moistureLow';
});

const trendSymbol = computed(() => {
  if (props.sensor.trend === 'up') return '↑';
  if (props.sensor.trend === 'down') return '↓';
  return '-';
});
</script>

<template>
  <div v-if="sensor" class="sensor-card mat-card-simulator">
    <header>
      <h2>{{ t('cards.iot.waterStress') }}</h2>
      <span class="grey-badge">{{ sensor.sourceLabel }}</span>
    </header>

    <section class="metric-row">
      <p>{{ t(metricLabelKey) || sensor.metricLabel }}:</p>
      <strong>{{ sensor.metricValue }} {{ sensor.metricUnit }} <small>{{ trendSymbol }}</small></strong>
    </section>

    <section class="risk-row">
      <p>{{ t('common.risk') }}:</p>
      <span class="grey-badge">
        {{ t('risk.' + sensor.riskLevel) || sensor.riskLevel }}
      </span>
    </section>

    <footer>
      <i class="pi pi-info-circle text-[18px]"></i>
      <span>{{ t(recommendationKey) || sensor.recommendation }}</span>
    </footer>
  </div>
</template>

<style scoped>
.mat-card-simulator {
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
  0px 1px 1px 0px rgba(0, 0, 0, 0.14),
  0px 1px 3px 0px rgba(0, 0, 0, 0.12);
  padding: 16px;
  display: block;
}

.sensor-card {
  display: flex;
  flex-direction: column;
  height: 186px;
  box-sizing: border-box;
}

.sensor-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sensor-card header h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1f2523;
  margin: 0;
}

.grey-badge {
  background: #F8F4ED;
  color: #8C877F;
  font-size: 11px;
  font-family: 'Poppins', sans-serif;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-row p {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #4f4f4f;
  margin: 0;
}

.metric-row strong {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1C1D21;
}

.metric-row small {
  font-size: 14px;
  color: #8C877F;
  margin-left: 4px;
}

.risk-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.risk-row p {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #4f4f4f;
  margin: 0;
}

.sensor-card footer {
  margin-top: auto;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #8C877F;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  border-top: 1px solid #f0f0f3;
  padding-top: 12px;
}

.sensor-card footer span {
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>