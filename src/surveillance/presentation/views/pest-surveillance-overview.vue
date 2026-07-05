<script setup>
/**
 * PestSurveillanceOverview page.
 * Pest monitoring dashboard with KPIs, map, report history, and report form.
 * @component
 */
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useSurveillanceStore } from '../../application/surveillance.store.js';
import { useAgronomicStore } from '../../../agronomic/application/agronomic.store.js';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';
import DashboardToolbar from '../../../shared/presentation/components/dashboard-toolbar.vue';
import SurveillanceMap from '../components/surveillance-map.vue';

const surveillanceStore = useSurveillanceStore();
const agronomicStore = useAgronomicStore();
const { t } = useI18n();
const router = useRouter();

/** Autonomous detections are not fed by the backend yet (placeholder, mirrors Angular reference). */
const autonomousDetections = [
    {
        title: 'Persistent low-vigor zone',
        plotLabel: 'Satellite',
        description: 'NDVI remained below expected range for 3 consecutive updates.',
        severity: 'Medium'
    },
    {
        title: 'Low-vigor cluster near boundary',
        plotLabel: 'Satellite',
        description: 'Vegetation vigor decreased in the south-west block.',
        severity: 'Medium'
    },
    {
        title: 'Community pattern detected',
        plotLabel: 'Satellite',
        description: 'Nearby signals suggest preventive monitoring is advised.',
        severity: 'Low'
    }
];

const severityClass = (severity) => `severity-${severity.toLowerCase()}`;

const showReportModal = ref(false);
const reportForm = ref({
    plotId: null,
    riskZone: 'PARTIAL_PLOT',
    symptoms: [],
    observedSeverity: 'MEDIUM',
    notes: ''
});
const selectedSymptoms = ref([]);
const selectedPlotId = ref(null);
const mapSourceFilter = ref('all');

const breadcrumbs = [
    { label: 'Pest Surveillance', disabled: true },
    { label: 'Overview', disabled: true },
];

const surveillanceViewOptions = [
    { id: 'alerts', label: 'Alerts', route: '/surveillance/alerts', icon: 'bell' },
    { id: 'pest-surveillance', label: 'Pest Surveillance', route: '/surveillance/pest-surveillance', icon: 'shield', active: true },
];

const riskZoneOptions = [
    { label: 'Full Plot', value: 'FULL_PLOT' },
    { label: 'Partial Plot', value: 'PARTIAL_PLOT' },
    { label: 'Edges', value: 'EDGES' }
];

const mapSourceFilters = [
    { label: 'All signals', value: 'all' },
    { label: 'Manual', value: 'manual' },
    { label: 'Satellite', value: 'satellite' },
    { label: 'Community', value: 'community' },
    { label: 'Autonomous', value: 'autonomous' }
];

const symptomValue = (symptom) => String(symptom.id ?? symptom.description ?? '');

const severityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' }
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

const selectedPlot = computed(() => {
    return agronomicStore.plots.find(plot => String(plot.id) === String(selectedPlotId.value)) ?? null;
});

const selectedBoundary = computed(() => selectedPlot.value?.polygonCoordinates ?? []);

const selectedPlotReports = computed(() => {
    if (!selectedPlotId.value) return surveillanceStore.pestReports;
    return surveillanceStore.pestReports.filter(report => String(report.plotId) === String(selectedPlotId.value));
});

const activeMapReports = computed(() => {
    if (mapSourceFilter.value !== 'all' && mapSourceFilter.value !== 'manual') return [];
    if (!selectedPlotId.value) return [];
    return surveillanceStore.activeConfirmedReports.filter(
        report => String(report.plotId) === String(selectedPlotId.value)
    );
});

const markerLocationForRiskZone = (boundary, riskZone, index) => {
    if (!boundary?.length) return [-70.04, -18.01];
    const center = boundary.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0])
        .map(total => total / boundary.length);
    const offset = 0.0015 * (index + 1);

    if (riskZone === 'EDGES') return boundary[index % boundary.length] ?? center;
    if (riskZone === 'PARTIAL_PLOT') return [center[0] + offset, center[1] - offset];
    return center;
};

const mapMarkers = computed(() => {
    const boundary = selectedBoundary.value;
    return activeMapReports.value.map((report, index) => ({
        lngLat: markerLocationForRiskZone(boundary, report.riskZone, index),
        riskZone: report.riskZone,
        label: 'Manual report · ' + (report.symptomsLabel || 'symptoms') + ' · ' + report.observedSeverity
    }));
});

const activeSignalsCount = computed(() => mapMarkers.value.length);

const selectPlot = (plotId) => {
    selectedPlotId.value = plotId;
    surveillanceStore.pestScopePlotId = plotId;
    if (plotId) surveillanceStore.loadCommunityRisk(plotId, 5);
};

const initializePlotScope = async () => {
    if (!agronomicStore.plotsLoaded) await agronomicStore.fetchPlots();
    const initialPlot = agronomicStore.plots[0];
    if (initialPlot?.id != null) selectPlot(initialPlot.id);
};

const refreshPestSurveillance = () => {
    surveillanceStore.fetchAlerts(50);
    surveillanceStore.loadPestReports();
    surveillanceStore.loadSymptoms();
    void initializePlotScope();
};

function openReportModal() {
    reportForm.value = {
        plotId: selectedPlotId.value ?? surveillanceStore.pestScopePlotId,
        riskZone: 'PARTIAL_PLOT',
        symptoms: [],
        observedSeverity: 'MEDIUM',
        notes: ''
    };
    selectedSymptoms.value = [];
    showReportModal.value = true;
}

async function submitReport() {
    const { plotId, riskZone, observedSeverity, notes } = reportForm.value;
    const request = { plotId, riskZone, symptoms: selectedSymptoms.value, observedSeverity, notes };
    await surveillanceStore.submitReport(request, () => { showReportModal.value = false; });
}

onMounted(async () => {
    surveillanceStore.fetchAlerts(50);
    surveillanceStore.loadPestReports();
    surveillanceStore.loadSymptoms();
    await initializePlotScope();
});
</script>

<template>
    <div class="pest-surveillance-overview">
        <DashboardHeader
            :breadcrumbs="breadcrumbs"
            subtitle="Monitor pest reports, risk zones, and plot-level surveillance signals."
            updated-label="Latest data"
            @refresh="refreshPestSurveillance"
        />

        <DashboardToolbar
            class="surveillance-toolbar"
            :view-options="surveillanceViewOptions"
        />

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="scope-selector">
                <label for="pest-plot-scope">Plot scope</label>
                <pv-select
                    id="pest-plot-scope"
                    v-model="selectedPlotId"
                    :options="agronomicStore.plots"
                    option-label="name"
                    option-value="id"
                    placeholder="Select plot"
                    class="scope-select"
                    @change="selectPlot(selectedPlotId)"
                />
            </div>
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
                    <div class="map-title-row">
                        <h2 class="table-title">Surveillance Map</h2>
                        <span class="active-signals-badge">{{ activeSignalsCount }} active signals</span>
                    </div>
                    <div class="filter-chips">
                        <button
                            v-for="filter in mapSourceFilters"
                            :key="filter.value"
                            type="button"
                            class="chip"
                            :class="{ active: mapSourceFilter === filter.value }"
                            @click="mapSourceFilter = filter.value"
                        >
                            {{ filter.label }}
                        </button>
                    </div>
                </div>
                <div class="map-container">
                    <SurveillanceMap
                        :key="String(selectedPlotId) + '-' + mapSourceFilter + '-' + mapMarkers.length"
                        :boundary="selectedBoundary"
                        :markers="mapMarkers"
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
                        <div v-for="report in selectedPlotReports" :key="report.id" class="table-row">
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
                        <div v-if="selectedPlotReports.length === 0" class="empty-msg">
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
                    <span class="risk-pattern-label">Probable pattern</span>
                    <strong class="risk-pattern">Possible {{ surveillanceStore.probableThreatLabel }} pattern</strong>

                    <div class="risk-status-grid">
                        <div class="risk-status-box">
                            <span>Status</span>
                            <strong>Under observation</strong>
                        </div>
                        <div class="risk-status-box">
                            <span>Estimated risk</span>
                            <strong class="risk-estimate">{{ surveillanceStore.riskConfidence >= 60 ? 'Medium-high' : 'Low-medium' }}</strong>
                        </div>
                    </div>

                    <span class="evidence-title">Main evidence</span>
                    <div class="evidence-list">
                        <div class="evidence-row">
                            <span class="evidence-num">{{ surveillanceStore.confirmedReports.length }}</span>
                            Confirmed symptom reports
                        </div>
                        <div class="evidence-row">
                            <span class="evidence-num">{{ surveillanceStore.pestReports.length }}</span>
                            Total symptom reports submitted
                        </div>
                        <div class="evidence-row">
                            <span class="evidence-num">{{ surveillanceStore.communityExposureCount }}</span>
                            Nearby community signals
                        </div>
                    </div>

                    <div class="next-step">
                        <i class="pi pi-info-circle"></i>
                        <div>
                            <strong>Recommended next step</strong>
                            <p>Inspect leaves and monitor low-vigor zones before requesting a specialist intervention.</p>
                        </div>
                    </div>

                    <pv-button label="Report symptoms" icon="pi pi-shield" class="p-button-outlined ghost-button block" @click="openReportModal" />
                    <pv-button label="View related alerts" icon="pi pi-megaphone" class="p-button-outlined ghost-button block" @click="router.push('/surveillance/alerts')" />
                    <pv-button label="Request expert" icon="pi pi-users" class="p-button-outlined ghost-button block" @click="router.push('/assistance/expert-assistance/request')" />
                </div>
            </template>
        </pv-card>

        <!-- Autonomous Detections -->
        <pv-card class="viora-table-card">
            <template #content>
                <div class="table-header">
                    <h2 class="table-title">Autonomous Detections</h2>
                    <span class="active-signals-badge">Preview</span>
                </div>
                <div class="autonomous-content">
                    <div class="autonomous-list">
                        <div v-for="detection in autonomousDetections" :key="detection.title" class="autonomous-row">
                            <span class="autonomous-icon"><i class="pi pi-globe"></i></span>
                            <div class="autonomous-body">
                                <strong>{{ detection.title }}</strong>
                                <span class="autonomous-source">{{ detection.plotLabel }}</span>
                                <p>{{ detection.description }}</p>
                            </div>
                            <span class="pill" :class="severityClass(detection.severity)">{{ detection.severity }}</span>
                        </div>
                    </div>
                    <p class="autonomous-note">Automatic detections will populate here once agronomic monitoring emits risk events.</p>
                </div>
            </template>
        </pv-card>

        <div v-if="surveillanceStore.errors.length > 0" class="error-box">
            <strong>Something went wrong loading surveillance data.</strong>
        </div>

        <!-- Report Form Modal -->
        <pv-dialog
            v-model:visible="showReportModal"
            header="Report Pest Sighting"
            modal
            :style="{ width: '480px' }"
        >
            <div class="report-form">
                <div class="field">
                    <label>Plot</label>
                    <pv-select
                        v-model="reportForm.plotId"
                        :options="agronomicStore.plots"
                        option-label="name"
                        option-value="id"
                        class="w-full"
                    />
                </div>
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
                    <label>Observed Severity</label>
                    <pv-select
                        v-model="reportForm.observedSeverity"
                        :options="severityOptions"
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
                            :key="symptomValue(symptom)"
                            class="symptom-chip"
                            :class="{ active: selectedSymptoms.includes(symptomValue(symptom)) }"
                            @click="
                                selectedSymptoms.includes(symptomValue(symptom))
                                    ? selectedSymptoms.splice(selectedSymptoms.indexOf(symptomValue(symptom)), 1)
                                    : selectedSymptoms.push(symptomValue(symptom))
                            "
                        >
                            {{ symptom.description || symptom.id }}
                        </span>
                    </div>
                </div>
                <div class="field">
                    <label>Notes</label>
                    <pv-textarea
                        v-model="reportForm.notes"
                        rows="3"
                        class="w-full"
                        placeholder="Add optional notes about what you observed..."
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

.surveillance-toolbar {
    margin-bottom: 24px;
}

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

.map-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.active-signals-badge {
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
    background: #F3F4F6;
    padding: 4px 12px;
    border-radius: 99px;
}

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

.error-box {
    padding: 16px 20px;
    border-radius: 12px;
    background: rgba(255, 92, 92, 0.12);
    color: #d63b3b;
    margin-bottom: 24px;
}

.risk-eval-content { padding: 20px; }

.risk-pattern-label { font-size: 12px; color: #9CA3AF; }

.risk-pattern {
    display: block;
    margin: 4px 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #C15A2E;
}

.risk-status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 18px;
}

.risk-status-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #F7F4EF;
}

.risk-status-box span { font-size: 12px; color: #9CA3AF; }
.risk-status-box strong { font-size: 14px; color: #1C1D21; }
.risk-estimate { color: #C15A2E; }

.evidence-title {
    display: block;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 500;
    color: #333333;
}

.evidence-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
}

.evidence-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #333333;
}

.evidence-num {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(46, 74, 58, 0.15);
    color: #2E4A3A;
    font-size: 12px;
    font-weight: 600;
}

.next-step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #FBF3E6;
    margin-bottom: 16px;
}

.next-step i { color: #C15A2E; font-size: 20px; }
.next-step strong { font-size: 13px; color: #C15A2E; }
.next-step p { margin: 4px 0 0; font-size: 12px; color: #6f6a62; }

.ghost-button.block { width: 100%; margin-top: 10px; }

.autonomous-content { padding: 20px; }

.autonomous-list { display: flex; flex-direction: column; gap: 14px; }

.autonomous-row {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    align-items: start;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #F9F7F3;
}

.autonomous-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: rgba(46, 74, 58, 0.15);
    color: #2E4A3A;
}

.autonomous-body strong { font-size: 14px; color: #1C1D21; }
.autonomous-source { display: block; margin: 2px 0 6px; font-size: 12px; color: #9CA3AF; }
.autonomous-body p { margin: 0; font-size: 12px; color: #6f6a62; }

.autonomous-note { margin: 16px 0 0; font-size: 12px; color: #9CA3AF; font-style: italic; }

.pill {
    display: inline-grid;
    place-items: center;
    min-height: 28px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

.severity-critical { background: #E53535; color: #ffffff; }
.severity-high { background: #FF5C5C; color: #ffffff; }
.severity-medium { background: rgba(240, 136, 62, 0.2); color: #C15A2E; }
.severity-low { background: #EEEEEE; color: #6f6a62; }

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
