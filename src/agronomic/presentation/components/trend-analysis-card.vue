<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';
import { useAgronomicStore } from '../../application/agronomic.store.js';

ChartJS.register(BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const { t } = useI18n();
const store = useAgronomicStore();

const timeRangeOptions = [
  { value: '7days', label: '7 days', labelKey: 'time.7days' },
  { value: '30days', label: '30 days', labelKey: 'time.30days' },
  { value: 'campaign', label: 'Campaign', labelKey: 'time.campaign' }
];

const chartData = computed(() => {
  const stats = store.analysisData;
  if (!stats) return { labels: [], datasets: [] };
  return {
    labels: stats.labels ?? [],
    datasets: [
      {
        type: 'bar',
        label: 'NDVI Index',
        data: stats.ndviSeries ?? [],
        yAxisID: 'yNDVI',
        backgroundColor: '#2E4A3A',
        borderColor: '#2E4A3A',
        borderRadius: 5,
        barThickness: 28,
        order: 2
      },
      {
        type: 'line',
        label: 'Chill Portions (CP)',
        data: stats.cpSeries ?? [],
        yAxisID: 'yCP',
        borderColor: '#5B8DEF',
        backgroundColor: '#5B8DEF',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: false,
        order: 1
      },
      {
        type: 'line',
        label: 'Threshold',
        data: (stats.labels ?? []).map(() => stats.threshold ?? 600),
        yAxisID: 'yCP',
        borderColor: '#FF8B8B',
        backgroundColor: '#FF8B8B',
        borderWidth: 2,
        borderDash: [8, 6],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
        fill: false,
        order: 0
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        color: '#1F2C26',
        font: { family: "'Poppins', sans-serif", size: 13, weight: 500 }
      }
    },
    tooltip: {
      backgroundColor: '#1F2C26',
      padding: 12,
      cornerRadius: 8,
      titleColor: '#FFFFFF',
      titleFont: { family: "'Poppins', sans-serif" },
      bodyColor: '#FFFFFF',
      bodyFont: { family: "'Poppins', sans-serif" }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#8C877F', font: { family: "'Poppins', sans-serif" } }
    },
    yNDVI: {
      type: 'linear',
      position: 'left',
      min: 0,
      max: 1,
      grid: { color: '#EFEAE3' },
      ticks: { color: '#8C877F', font: { family: "'Poppins', sans-serif" } },
      title: {
        display: true,
        text: 'NDVI Index',
        color: '#1F2C26',
        font: { family: "'Poppins', sans-serif", size: 13, weight: 700 }
      }
    },
    yCP: {
      type: 'linear',
      position: 'right',
      min: 0,
      max: 700,
      grid: { drawOnChartArea: false },
      ticks: { color: '#8C877F', font: { family: "'Poppins', sans-serif" } },
      title: {
        display: true,
        text: 'Chill Portions (CP)',
        color: '#5B8DEF',
        font: { family: "'Poppins', sans-serif", size: 13, weight: 700 }
      }
    }
  }
};

const onPlotSelected = (event) => store.setAnalysisPlot(event.target.value);
const onTimeRangeSelected = (event) => store.setAnalysisTimeRange(event.target.value);
</script>

<template>
  <div class="trend-analysis-card">
    <div class="trend-header">
      <h2>{{ t('dashboard.analysis-title') }}</h2>
      <div class="trend-controls">
        <select :value="store.analysisPlotId" @change="onPlotSelected" class="trend-select">
          <option value="all">All Plots</option>
          <option v-for="plot in store.plots" :key="plot.id" :value="plot.id">{{ plot.name }}</option>
        </select>
        <select :value="store.analysisTimeRange" @change="onTimeRangeSelected" class="trend-select">
          <option v-for="opt in timeRangeOptions" :key="opt.value" :value="opt.value">{{ t(opt.labelKey) }}</option>
        </select>
      </div>
    </div>
    <div class="trend-chart-container">
      <Bar v-if="chartData.labels.length" :data="chartData" :options="chartOptions" />
      <p v-else class="trend-empty">{{ t('dashboard.insufficient-records-msg') }}</p>
    </div>
  </div>
</template>

<style scoped>
.trend-analysis-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
  padding: 22px;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.trend-header h2 {
  margin: 0;
  color: #1f2523;
  font-size: 18px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

.trend-controls {
  display: flex;
  gap: 10px;
}

.trend-select {
  padding: 6px 12px;
  border: 1px solid #edf0ec;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #1f2523;
  background: #fff;
  cursor: pointer;
}

.trend-chart-container {
  height: 320px;
}

.trend-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8c877f;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
}
</style>
