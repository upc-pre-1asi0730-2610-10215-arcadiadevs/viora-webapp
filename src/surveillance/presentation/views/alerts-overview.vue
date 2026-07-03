<script setup>
/**
 * AlertsOverview page.
 * Full surveillance alerts dashboard with KPIs, table, and community risk section.
 * @component
 */
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSurveillanceStore } from '../../application/surveillance.store.js';
import CommunityRiskMap from '../components/community-risk-map.vue';

const surveillanceStore = useSurveillanceStore();
const { t } = useI18n();

const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const filteredAlerts = computed(() => {
    if (!searchQuery.value) return surveillanceStore.alerts;
    const q = searchQuery.value.toLowerCase();
    return surveillanceStore.alerts.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.plot?.name?.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
});

const paginatedAlerts = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredAlerts.value.slice(start, start + pageSize.value);
});

const totalPages = computed(() => Math.ceil(filteredAlerts.value.length / pageSize.value));

const getAlertIcon = (type) => {
    if (type === 'Phenological risk') return 'pi pi-cloud';
    if (type === 'Pest symptom report') return 'pi pi-exclamation-triangle';
    if (type === 'Low NDVI zone') return 'pi pi-map';
    return 'pi pi-bell';
};

const getSeverityStyle = (severity) => {
    if (severity === 'Critical') return { backgroundColor: '#E53535' };
    if (severity === 'High') return { backgroundColor: '#FF5C5C' };
    if (severity === 'Medium') return { backgroundColor: '#C15A2E' };
    return { backgroundColor: '#9CA3AF' };
};

const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'active') return { backgroundColor: 'rgba(87, 235, 161, 0.2)', color: '#2E4A3A' };
    if (s === 'suggest') return { backgroundColor: 'rgba(91, 141, 239, 0.2)', color: '#5B8DEF' };
    if (s === 'under review') return { backgroundColor: 'rgba(193, 90, 46, 0.2)', color: '#C15A2E' };
    return { backgroundColor: '#F3F4F6', color: '#6B7280' };
};

onMounted(() => {
    surveillanceStore.fetchAlerts(50);
    surveillanceStore.loadCommunityRisk(1, 5);
});
</script>

<template>
    <div class="alerts-overview">
        <!-- Breadcrumb -->
        <div class="breadcrumb-header">
            <span class="breadcrumb-item">Surveillance</span>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-item active">Alerts Overview</span>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-icon"><i class="pi pi-bell"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.activeAlertsCount }}</span>
                    <span class="kpi-label">Active Alerts</span>
                </div>
            </div>
            <div class="kpi-card critical">
                <div class="kpi-icon"><i class="pi pi-exclamation-circle"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.criticalCount }}</span>
                    <span class="kpi-label">Critical Risk</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon"><i class="pi pi-map"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.affectedPlotCount }}</span>
                    <span class="kpi-label">Affected Plots</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon"><i class="pi pi-check-circle"></i></div>
                <div class="kpi-content">
                    <span class="kpi-value">{{ surveillanceStore.recommendedActionsCount }}</span>
                    <span class="kpi-label">Recommended Actions</span>
                </div>
            </div>
        </div>

        <!-- Alerts Table -->
        <pv-card class="viora-table-card">
            <template #content>
                <div class="table-header">
                    <h2 class="table-title">Surveillance Alerts</h2>
                    <pv-inputtext
                        v-model="searchQuery"
                        placeholder="Search alerts..."
                        class="search-input"
                    />
                </div>
                <div class="alerts-table">
                    <div class="table-thead">
                        <div class="col-type">Type</div>
                        <div class="col-plot">Plot</div>
                        <div class="col-severity">Severity</div>
                        <div class="col-date">Date</div>
                        <div class="col-status">Status</div>
                        <div class="col-actions">Actions</div>
                    </div>
                    <div v-if="surveillanceStore.loading.alerts" class="loading-state">
                        <div v-for="i in 5" :key="i" class="skeleton-row animate-pulse"></div>
                    </div>
                    <div v-else class="table-tbody">
                        <div v-for="alert in paginatedAlerts" :key="alert.id" class="table-row">
                            <div class="col-type cell-type">
                                <div class="icon-square">
                                    <i :class="[getAlertIcon(alert.type), 'type-icon']"></i>
                                </div>
                                <div class="type-text-wrapper">
                                    <span class="type-name">{{ alert.typeLabel }}</span>
                                    <span class="type-description" :title="alert.description">{{ alert.descriptionPreview }}</span>
                                </div>
                            </div>
                            <div class="col-plot cell-plot">
                                <span class="plot-name">{{ alert.plot?.name || 'N/A' }}</span>
                                <span class="plot-meta">{{ alert.plot?.location }}</span>
                            </div>
                            <div class="col-severity">
                                <div class="severity-tag" :style="getSeverityStyle(alert.severity)">
                                    {{ alert.severity }}
                                </div>
                            </div>
                            <div class="col-date">{{ alert.formattedDate }}</div>
                            <div class="col-status">
                                <div class="status-label" :style="getStatusStyle(alert.status)">
                                    {{ alert.status }}
                                </div>
                            </div>
                            <div class="col-actions">
                                <pv-button
                                    v-if="alert.status === 'Pending'"
                                    icon="pi pi-eye"
                                    class="p-button-text p-button-sm"
                                    @click="surveillanceStore.markUnderReview(alert.id)"
                                    v-tooltip.top="'Mark Under Review'"
                                />
                                <pv-button
                                    v-if="alert.status === 'Under review'"
                                    icon="pi pi-check"
                                    class="p-button-text p-button-sm p-button-success"
                                    @click="surveillanceStore.resolveAlert(alert.id)"
                                    v-tooltip.top="'Resolve'"
                                />
                                <pv-button
                                    icon="pi pi-times"
                                    class="p-button-text p-button-sm p-button-secondary"
                                    @click="surveillanceStore.dismissAlert(alert.id)"
                                    v-tooltip.top="'Dismiss'"
                                />
                            </div>
                        </div>
                        <div v-if="paginatedAlerts.length === 0" class="empty-msg">
                            No alerts found matching your criteria.
                        </div>
                    </div>
                </div>
                <!-- Pagination -->
                <div v-if="totalPages > 1" class="pagination">
                    <pv-button
                        icon="pi pi-chevron-left"
                        class="p-button-text p-button-sm"
                        :disabled="currentPage <= 1"
                        @click="currentPage--"
                    />
                    <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
                    <pv-button
                        icon="pi pi-chevron-right"
                        class="p-button-text p-button-sm"
                        :disabled="currentPage >= totalPages"
                        @click="currentPage++"
                    />
                </div>
            </template>
        </pv-card>

        <!-- Community Risk Section -->
        <pv-card v-if="surveillanceStore.communityRisk" class="viora-table-card community-risk-section">
            <template #content>
                <div class="table-header">
                    <h2 class="table-title">Community Risk</h2>
                    <span class="radius-badge">{{ surveillanceStore.communityRisk.radiusKm }} km radius</span>
                </div>
                <div class="community-risk-layout">
                    <div class="risk-map-col">
                        <CommunityRiskMap
                            :center="[-70.04, -18.01]"
                            :radius-km="surveillanceStore.communityRisk.radiusKm"
                            :signals="surveillanceStore.communityRisk.signals"
                        />
                    </div>
                    <div class="risk-details-col">
                        <div class="signals-list">
                            <h3 class="section-label">Signals ({{ surveillanceStore.communityRisk.signals.length }})</h3>
                            <div
                                v-for="signal in surveillanceStore.communityRisk.signals"
                                :key="signal.id"
                                class="signal-item"
                                :class="{ selected: surveillanceStore.selectedSignalId === signal.id }"
                                @click="surveillanceStore.selectSignal(signal.id)"
                            >
                                <div class="signal-severity" :style="getSeverityStyle(signal.severity)"></div>
                                <div class="signal-info">
                                    <span class="signal-title">{{ signal.title }}</span>
                                    <span class="signal-meta">{{ signal.distanceKm }} km &bull; {{ signal.probableThreat }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="surveillanceStore.selectedSignal" class="threat-detail">
                            <h3 class="section-label">Threat Detail</h3>
                            <p><strong>Probable Threat:</strong> {{ surveillanceStore.selectedSignal.probableThreat }}</p>
                            <p><strong>Distance:</strong> {{ surveillanceStore.selectedSignal.distanceKm }} km</p>
                            <p><strong>Severity:</strong> {{ surveillanceStore.selectedSignal.severity }}</p>
                        </div>
                        <div class="recommendations">
                            <h3 class="section-label">Preventive Recommendations</h3>
                            <ul>
                                <li v-for="(rec, i) in surveillanceStore.communityRisk.preventiveRecommendations" :key="i">
                                    {{ rec }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </template>
        </pv-card>
    </div>
</template>

<style scoped>
.alerts-overview {
    padding: 24px;
    font-family: 'Poppins', sans-serif;
}

.breadcrumb-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    font-size: 14px;
    color: #6B7280;
}

.breadcrumb-item.active {
    color: #1C1D21;
    font-weight: 600;
}

.breadcrumb-sep { color: #D1D5DB; }

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.kpi-card.critical {
    border-left: 4px solid #E53535;
}

.kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: rgba(46, 74, 58, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
}

.kpi-icon i { font-size: 20px; color: #2E4A3A; }

.kpi-card.critical .kpi-icon {
    background: rgba(229, 53, 53, 0.08);
}

.kpi-card.critical .kpi-icon i { color: #E53535; }

.kpi-content { display: flex; flex-direction: column; }
.kpi-value { font-size: 24px; font-weight: 600; color: #1C1D21; }
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

.search-input {
    width: 260px;
    border-radius: 8px;
    font-size: 14px;
}

.radius-badge {
    background: rgba(46, 74, 58, 0.1);
    color: #2E4A3A;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 500;
}

.alerts-table { overflow-x: auto; }
.table-thead, .table-tbody { min-width: 900px; }

.table-thead {
    display: flex;
    background-color: rgba(245, 245, 250, 0.4);
    padding: 8px 20px;
    border-bottom: 1px solid #F0F0F3;
}

.table-thead div {
    font-weight: 500;
    font-size: 12px;
    color: #333333;
    text-transform: capitalize;
}

.table-row {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #F0F0F3;
}

.table-row:last-child { border-bottom: none; }

.col-type { flex: 2.5; min-width: 250px; }
.col-plot { flex: 2; min-width: 180px; display: flex; flex-direction: column; }
.col-severity { flex: 1; min-width: 100px; }
.col-date { flex: 1.2; min-width: 110px; font-size: 14px; color: #4B5563; }
.col-status { flex: 1.5; min-width: 150px; }
.col-actions { flex: 1; min-width: 120px; display: flex; gap: 4px; }

.cell-type { display: flex; align-items: center; gap: 15px; }

.icon-square {
    width: 48px; height: 48px;
    background-color: #F8F9FA;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.type-icon { font-size: 22px; color: #1C1D21; }

.type-text-wrapper { display: flex; flex-direction: column; gap: 2px; overflow: hidden; text-align: left; }
.type-name { font-weight: 600; font-size: 14px; color: #1C1D21; }
.type-description { font-size: 12px; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.cell-plot { gap: 2px; text-align: left; }
.plot-name { font-weight: 600; font-size: 14px; color: #1C1D21; }
.plot-meta { font-size: 12px; color: #6B7280; }

.severity-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 16px;
    border-radius: 99px;
    color: #FFFFFF;
    font-weight: 500;
    font-size: 12px;
}

.status-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
}

.empty-msg { padding: 30px; text-align: center; color: #9CA3AF; font-style: italic; }

.skeleton-row { height: 70px; margin: 10px 20px; background-color: #F9FAFB; border-radius: 8px; }

.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #F0F0F3;
}

.page-info { font-size: 14px; color: #6B7280; }

.community-risk-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 20px;
}

.section-label {
    font-size: 14px;
    font-weight: 600;
    color: #1C1D21;
    margin-bottom: 12px;
}

.signals-list { display: flex; flex-direction: column; gap: 8px; }

.signal-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.signal-item:hover { background: #F9FAFB; }
.signal-item.selected { background: rgba(46, 74, 58, 0.06); }

.signal-severity { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.signal-info { display: flex; flex-direction: column; }
.signal-title { font-weight: 600; font-size: 14px; color: #1C1D21; }
.signal-meta { font-size: 12px; color: #6B7280; }

.threat-detail { margin-top: 16px; padding-top: 16px; border-top: 1px solid #F0F0F3; }
.threat-detail p { font-size: 14px; color: #4B5563; margin: 4px 0; }

.recommendations { margin-top: 16px; }
.recommendations ul { padding-left: 20px; }
.recommendations li { font-size: 14px; color: #4B5563; margin-bottom: 6px; }
</style>
