<script setup>
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../application/agronomic.store.js';

const store = useAgronomicStore();
const { t } = useI18n();
</script>

<template>
  <div class="iot-card mat-card-simulator">
    <h2>{{ t('cards.iot.title') }}</h2>

    <template v-if="store.iotDevicesLoaded">
      <div class="iot-line">
        <span class="status-dot"></span>
        <span>
          <strong>{{ store.onlineDevicesCount }}</strong>
          <template v-if="store.dashboardScope === 'all'">
            {{ t('cards.iot.devicesOnline') }}
          </template>
          <template v-else>
            {{ t('cards.iot.sensorsOnline') }}
          </template>
        </span>
      </div>

      <div class="iot-line">
        <span class="status-dot"></span>
        <span>
          <template v-if="store.dashboardScope === 'all'">
            <strong>{{ store.plotsWithIotCount }}</strong> {{ t('cards.iot.plotsWithIot') }}
          </template>
          <template v-else-if="store.selectedDashboardPlot">
            {{ t('cards.iot.selectedPlotScope', { plot: store.selectedDashboardPlot.name }) || store.selectedDashboardPlot.name }} {{ t('cards.iot.iotScope') }}
          </template>
          <template v-else>
            {{ t('cards.iot.selectedScope') }}
          </template>
        </span>
      </div>

      <footer>
        <i class="pi pi-info-circle text-[#8C877F] text-[18px]"></i>
        <span>{{ store.lastSyncLabel }}</span>
      </footer>
    </template>

    <template v-else>
      <p class="empty">{{ t('cards.iot.loading') }}</p>
    </template>
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

.iot-card {
  display: flex;
  flex-direction: column;
  height: 186px;
  box-sizing: border-box;
}

.iot-card h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1f2523;
  margin: 0 0 16px 0;
}

.iot-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #333333;
}

.iot-line strong {
  font-weight: 600;
  margin-right: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #38A169;
}

.iot-card footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8C877F;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  border-top: 1px solid #f0f0f3;
  padding-top: 12px;
}

.empty {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #8C877F;
}
</style>