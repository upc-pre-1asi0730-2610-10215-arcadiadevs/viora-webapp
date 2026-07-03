<script setup>
/**
 * PestSurveillanceOverview page.
 * Pest monitoring dashboard with KPIs, map, report history, and report form.
 * @component
 */
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSurveillanceStore } from '../../application/surveillance.store.js';
import SurveillanceMap from '../components/surveillance-map.vue';

const surveillanceStore = useSurveillanceStore();
const { t } = useI18n();

const showReportModal = ref(false);
const reportForm = ref({
    plotId: null,
    riskZone: 'PARTIAL_PLOT',
    symptoms: [],
    description: ''
});
const selectedSymptoms = ref([]);

const riskZoneOptions = [
    { label: 'Full Plot', value: 'FULL_PLOT' },
    { label: 'Partial Plot', value: 'PARTIAL_PLOT' },
    { label: 'Edges', value: 'EDGES' }
];

const getSeverityStyle = (severity) => {
    if (severity === 'Critical') return { backgroundColor: '#E53535' };
    if (severity === 'High') return { backgroundColor: '#FF5C5C' };
    if (severity === 'Medium') return { backgroundColor: '#C15A2E' };
    return { backgroundColor: '#9CA3AF' };
};

const getResultStyle = (result) => {
    if (result === 'Alert confirmed') return { backgroundColor: 'rgba(229, 53, 53, 0.1)', color: '#E53535' };
    if (result === 'Under review') return { backgroundColor: 'rgba(193, 90, 46, 0.2)', color: '#C15A2E' };
    return { backgroundColor: '#F3F4F6', color: '#6B7280' };
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(dateStr));
};

function openReportModal() {
    reportForm.value = { plotId: surveillanceStore.pestScopePlotId, riskZone: 'PARTIAL_PLOT', symptoms: [], description: '' };
    selectedSymptoms.value = [];
    showReportModal.value = true;
}

async function submitReport() {
    const request = { ...reportForm.value, symptoms: selectedSymptoms.value };
    await surveillanceStore.submitReport(request, () => { showReportModal.value = false; });
}

onMounted(() => {
    surveillanceStore.fetchAlerts(50);
    surveillanceStore.loadPestReports();
    surveillanceStore.loadSymptoms();
    if (surveillanceStore.pestScopePlotId) {
        surveillanceStore.loadCommunityRisk(surveillanceStore.pestScopePlotId);
    }
});
</script>

<template>
    <div class="pest-surveillance-overview">
        <!-- Breadcrumb -->
        <div class="breadcrumb-header">
            <span class="breadcrumb-item">Surveillance</span>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-item active">Pest Surveillance</span>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <pv-button
                label="Report Pest Sighting"
                icon="pi pi-plus"
                class="p-button-success"
                @click="openReportModal"
            />
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-icon"><i class="pi pi-shield"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.activeAlertsCount }}</span>
                    <span class="kpi-label">Surveillance Status</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon warning"><i class="pi pi-exclamation-triangle"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.probableThreatLabel }}</span>
                    <span class="kpi-label">Probable Threat</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon"><i class="pi pi-chart-bar"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.riskConfidence }}%</span>
                    <span class="kpi-label">Risk Confidence</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon"><i class="pi pi-users"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.communityExposureCount }}</span>
                    <span class="kpi-label">Community Exposure</span>
                </div>
            </div>
        </div>

        <!-- Surveillance Map -->
        <pv-card class="viora-table-card">
            <template #content>
                <div class="table-header">
                    <h2 class="table-title">Surveillance Map</h2>
                    <div class="filter-chips">
                        <span class="chip active">All Zones</span>
                        <span class="chip">Full Plot</span>
                        <span class="chip">Partial Plot</span>
                        <span class="chip">Edges</span>
                    </div>
                </div>
                <div class="map-container">
                    <SurveillanceMap
                        :boundary="[
                            [-70.05, -18.00],
                            [-70.03, -18.00],
                            [-70.03, -18.02],
                            [-70.05, -18.02]
                        ]"
                        :markers="[
                            { lngLat: [-70.04, -18.01], riskZone: 'FULL_PLOT', label: 'Center detection' },
                            { lngLat: [-70.045, -18.005], riskZone: 'EDGES', label: 'Edge signal' }
                        ]"
                    />
                </div>
            </template>
        </pv-card>

        <!-- Report History Table -->
        <pv-card class="viora-table-card">
            <template #content>
                <div class="table-header">
                    <h2 class="table-title">Report History</h2>
                </div>
                <div class="reports-table">
                    <div class="table-thead">
                        <div class="col-code">Code</div>
                        <div class="col-plot">Plot</div>
                        <div class="col-zone">Risk Zone</div>
                        <div class="col-symptoms">Symptoms</div>
                        <div class="col-result">Result</div>
                        <div class="col-date">Date</div>
                    </div>
                    <div v-if="surveillanceStore.loading.reports" class="loading-state">
                        <div v-for="i in 3" :key="i" class="skeleton-row animate-pulse"></div>
                    </div>
                    <div v-else class="table-tbody">
                        <div v-for="report in surveillanceStore.pestReports" :key="report.id" class="table-row">
                            <div class="col-code code-label">{{ report.codeLabel }}</div>
                            <div class="col-plot">{{ report.plotName || 'N/A' }}</div>
                            <div class="col-zone">{{ report.riskZoneLabel }}</div>
                            <div class="col-symptoms symptoms-text">{{ report.symptomsLabel }}</div>
                            <div class="col-result">
                                <span class="result-badge" :style="getResultStyle(report.result)">
                                    {{ report.resultLabel }}
                                </span>
                            </div>
                            <div class="col-date">{{ formatDate(report.date) }}</div>
                        </div>
                        <div v-if="surveillanceStore.pestReports.length === 0" class="empty-msg">
                            No pest reports found.
                        </div>
                    </div>
                </div>
            </template>
        </pv-card>

        <!-- Risk Evaluation Panel -->
        <pv-card v-if="surveillanceStore.communityRisk" class="viora-table-card">
            <template #content>
                <div class="table-header">
                    <h2 class="table-title">Risk Evaluation</h2>
                </div>
                <div class="risk-eval-content">
                    <div class="risk-summary">
                        <p><strong>Community signals:</strong> {{ surveillanceStore.communityExposureCount }}</p>
                        <p><strong>Confirmed reports:</strong> {{ surveillanceStore.confirmedReports.length }}</p>
                        <p><strong>Active confirmed:</strong> {{ surveillanceStore.activeConfirmedReports.length }}</p>
                    </div>
                </div>
            </template>
        </pv-card>

        <!-- Report Form Modal -->
        <pv-dialog
            v-model:visible="showReportModal"
            header="Report Pest Sighting"
            modal
            :style="{ width: '480px' }"
        >
            <div class="report-form">
                <div class="field">
                    <label>Risk Zone</label>
                    <pv-select
                        v-model="reportForm.riskZone"
                        :options="riskZoneOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>
                <div class="field">
                    <label>Symptoms</label>
                    <div class="symptom-chips">
                        <span
                            v-for="symptom in surveillanceStore.symptoms"
                            :key="symptom.id"
                            class="symptom-chip"
                            :class="{ active: selectedSymptoms.includes(symptom.description) }"
                            @click="
                                selectedSymptoms.includes(symptom.description)
                                    ? selectedSymptoms.splice(selectedSymptoms.indexOf(symptom.description), 1)
                                    : selectedSymptoms.push(symptom.description)
                            "
                        >
                            {{ symptom.description }}
                        </span>
                    </div>
                </div>
                <div class="field">
                    <label>Description</label>
                    <pv-textarea
                        v-model="reportForm.description"
                        rows="3"
                        class="w-full"
                        placeholder="Describe what you observed..."
                    />
                </div>
            </div>
            <template #footer>
                <pv-button label="Cancel" class="p-button-text" @click="showReportModal = false" />
                <pv-button
                    label="Submit Report"
                    icon="pi pi-check"
                    class="p-button-success"
                    :loading="surveillanceStore.loading.submitting"
                    @click="submitReport"
                />
            </template>
        </pv-dialog>
    </div>
</template>

<style scoped>
.pest-surveillance-overview {
    padding: 24px;
    font-family: 'Poppins', sans-serif;
}

.breadcrumb-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #6B7280;
}

.breadcrumb-item.active { color: #1C1D21; font-weight: 600; }
.breadcrumb-sep { color: #D1D5DB; }

.toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.kpi-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #F0F0F3;
}

.kpi-icon {
    width: 48px; height: 48px;
    border-radius: 10px;
    background: rgba(46, 74, 58, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
}

.kpi-icon i { font-size: 20px; color: #2E4A3A; }
.kpi-icon.warning { background: rgba(193, 90, 46, 0.08); }
.kpi-icon.warning i { color: #C15A2E; }

.kpi-content { display: flex; flex-direction: column; overflow: hidden; }
.kpi-value { font-size: 20px; font-weight: 600; color: #1C1D21; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi-label { font-size: 12px; color: #6B7280; }

.viora-table-card {
    border-radius: 12px;
    border: 1px solid #F0F0F3;
    background-color: #ffffff;
    overflow: hidden;
    margin-bottom: 24px;
}

:deep(.p-card-content) { padding: 0 !important; }

.table-header {
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #F0F0F3;
}

.table-title { font-weight: 500; font-size: 20px; color: #1C1D21; margin: 0; }

.filter-chips { display: flex; gap: 8px; }
.chip {
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 500;
    background: #F3F4F6;
    color: #6B7280;
    cursor: pointer;
}
.chip.active { background: rgba(46, 74, 58, 0.1); color: #2E4A3A; }

.map-container { height: 360px; }

.reports-table { overflow-x: auto; }
.table-thead, .table-tbody { min-width: 700px; }

.table-thead {
    display: flex;
    background-color: rgba(245, 245, 250, 0.4);
    padding: 8px 20px;
    border-bottom: 1px solid #F0F0F3;
}

.table-thead div { font-weight: 500; font-size: 12px; color: #333333; text-transform: capitalize; }

.table-row {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #F0F0F3;
}

.table-row:last-child { border-bottom: none; }

.col-code { flex: 1.2; min-width: 120px; }
.col-plot { flex: 1.5; min-width: 140px; }
.col-zone { flex: 1; min-width: 110px; }
.col-symptoms { flex: 2; min-width: 180px; }
.col-result { flex: 1.2; min-width: 120px; }
.col-date { flex: 1; min-width: 110px; font-size: 14px; color: #4B5563; }

.code-label { font-weight: 600; font-size: 14px; color: #1C1D21; }
.symptoms-text { font-size: 13px; color: #4B5563; }

.result-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 500;
}

.empty-msg { padding: 30px; text-align: center; color: #9CA3AF; font-style: italic; }
.skeleton-row { height: 60px; margin: 10px 20px; background-color: #F9FAFB; border-radius: 8px; }

.risk-eval-content { padding: 20px; }
.risk-summary p { font-size: 14px; color: #4B5563; margin: 6px 0; }

.report-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 14px; font-weight: 600; color: #1C1D21; }
.w-full { width: 100%; }

.symptom-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.symptom-chip {
    padding: 6px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 500;
    background: #F3F4F6;
    color: #6B7280;
    cursor: pointer;
    transition: all 0.15s;
}
.symptom-chip.active { background: rgba(46, 74, 58, 0.1); color: #2E4A3A; }
</style>
