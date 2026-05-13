<script setup>
/**
 * IotDeviceListView component.
 * Displays a paginated list of IoT devices with their current telemetry and status.
 *
 * @component
 */
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useConfirm } from "primevue";
import { useAgronomicStore } from "../../application/agronomic.store.js";
import { onMounted, toRefs, ref, computed } from "vue";

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const store = useAgronomicStore();
const { iotDevices, errors, iotDevicesLoaded, plots } = toRefs(store);
const { fetchIotDevices, deleteIotDevice, fetchPlots } = store;

/** 
 * Index of the first record in the current page.
 * @type {import('vue').Ref<number>} 
 */
const first = ref(0);

/** 
 * Number of rows per page.
 * @type {import('vue').Ref<number>} 
 */
const rows = ref(5);

onMounted(() => {
    if (!store.iotDevicesLoaded) fetchIotDevices();
    if (plots.value.length === 0) fetchPlots();
});

/** 
 * Navigates to the device creation view.
 */
const navigateToNew = () => {
    router.push({ name: 'agronomic-iot-device-new' });
};

/** 
 * Navigates to the device editing view.
 * @param {number|string} id - Device identifier.
 */
const navigateToEdit = (id) => {
    router.push({ name: 'agronomic-iot-device-edit', params: { id } });
};

/** 
 * Displays a confirmation dialog for device deletion.
 * @param {Object} device - The device entity to delete.
 */
const confirmDelete = (device) => {
    confirm.require({
        group: 'viora-delete',
        message: t('iot-devices.confirm-delete', { name: device.name }),
        header: t('iot-devices.delete-header'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            deleteIotDevice(device);
        },
    });
};

/** 
 * Calculates visual style for device status labels.
 * @param {string} status - Device status value.
 * @returns {Object} CSS style object.
 */
const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'active') return { backgroundColor: 'rgba(87, 235, 161, 0.2)', color: '#2E4A3A' };
    if (s === 'warning') return { backgroundColor: 'rgba(193, 90, 46, 0.2)', color: '#C15A2E' };
    if (s === 'critical') return { backgroundColor: 'rgba(229, 53, 53, 0.2)', color: '#E53535' };
    return { backgroundColor: '#F3F4F6', color: '#6B7280' };
};

/** 
 * Resolves the plot name from its identifier.
 * @param {number|string} plotId - Plot identifier.
 * @returns {string} The plot name or 'Unknown Plot'.
 */
const getPlotName = (plotId) => {
    const plot = plots.value.find(p => p.id === plotId);
    return plot ? plot.name : 'Unknown Plot';
};

/** 
 * Formats a raw date string into a localized format.
 * @param {string} dateStr - Date string to format.
 * @returns {string} Localized date string.
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
};

/** 
 * Slice of IoT devices based on current pagination state.
 * @type {import('vue').ComputedRef<Array<Object>>} 
 */
const paginatedDevices = computed(() => {
    return iotDevices.value.slice(first.value, first.value + rows.value);
});

/** 
 * Handles paginator page changes.
 * @param {Object} event - Paginator change event.
 */
const onPageChange = (event) => {
    first.value = event.first;
    rows.value = event.rows;
};
</script>

<template>
    <div class="iot-devices-container">
        <div class="dashboard-toolbar mb-6">
            <div class="toolbar-side"></div>
            <div class="toolbar-center"></div>
            <div class="toolbar-side right-align">
                <pv-button 
                    :label="t('iot-devices.new')" 
                    icon="pi pi-plus" 
                    class="viora-outline-btn-long" 
                    @click="navigateToNew" 
                />
            </div>
        </div>

        <pv-card class="viora-table-card shadow-none">
            <template #content>
                <div class="widget-layout">
                    <div class="alerts-table">
                        <div class="table-thead">
                            <div class="col-name">{{ t('iot-devices.fields.name') }}</div>
                            <div class="col-plot">{{ t('iot-devices.fields.plot') }}</div>
                            <div class="col-moisture">{{ t('iot-devices.fields.soil-moisture') }}</div>
                            <div class="col-temp">{{ t('iot-devices.fields.temperature') }}</div>
                            <div class="col-leaf">{{ t('iot-devices.fields.leaf-humidity') }}</div>
                            <div class="col-status">{{ t('iot-devices.fields.status') }}</div>
                            <div class="col-actions">{{ t('iot-devices.fields.actions') }}</div>
                        </div>

                        <div v-if="iotDevicesLoaded" class="table-tbody">
                            <div v-for="device in paginatedDevices" :key="device.id" class="table-row">
                                <div class="col-name cell-type">
                                    <div class="icon-square">
                                        <i class="pi pi-box type-icon"></i>
                                    </div>
                                    <div class="type-text-wrapper">
                                        <span class="type-name">{{ device.name }}</span>
                                        <span class="type-description">ID: {{ device.id }} • {{ formatDate(device.lastUpdate) }}</span>
                                    </div>
                                </div>

                                <div class="col-plot cell-plot">
                                    <span class="plot-name">{{ getPlotName(device.plotId) }}</span>
                                </div>

                                <div class="col-moisture cell-moisture">
                                    <span :class="{'text-red-500 font-bold': device.soilMoisture < 20}">
                                        {{ device.soilMoisture }}%
                                    </span>
                                </div>

                                <div class="col-temp cell-temp">
                                    {{ device.temperature }}°C
                                </div>

                                <div class="col-leaf cell-leaf">
                                    {{ device.leafHumidity }}%
                                </div>

                                <div class="col-status cell-status">
                                    <div class="status-label" :style="getStatusStyle(device.status)">
                                        {{ device.status }}
                                    </div>
                                </div>

                                <div class="col-actions cell-actions">
                                    <pv-button icon="pi pi-pencil" rounded text severity="info" @click="navigateToEdit(device.id)" />
                                    <pv-button icon="pi pi-trash" rounded text severity="danger" @click="confirmDelete(device)" />
                                </div>
                            </div>

                            <div v-if="iotDevices.length === 0" class="empty-msg">
                                {{ t('iot-devices.no-data') }}
                            </div>
                        </div>

                        <div v-else class="loading-state">
                            <div v-for="i in 3" :key="i" class="skeleton-row animate-pulse"></div>
                        </div>
                    </div>

                    <div class="pagination-wrapper border-t border-gray-100 py-3 px-4">
                        <pv-paginator 
                            v-model:first="first" 
                            :rows="rows" 
                            :totalRecords="iotDevices.length" 
                            :rowsPerPageOptions="[5, 10, 20]"
                            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                            class="viora-paginator"
                            @page="onPageChange"
                        />
                    </div>
                </div>
            </template>
        </pv-card>

        <div v-if="errors.length" class="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
            <p class="font-bold text-red-700">{{ t('errors.occurred') }}</p>
            <ul class="list-disc ml-5 text-red-600 mt-1">
                <li v-for="e in errors" :key="e.message">{{ e.message }}</li>
            </ul>
        </div>

        <pv-confirm-dialog group="viora-delete">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="viora-confirm-dialog p-6 rounded-[24px] bg-white border border-gray-100 shadow-xl max-w-[400px]">
                    <div class="flex flex-column align-items-center text-center gap-4">
                        <div class="confirm-icon-circle bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center">
                            <i class="pi pi-exclamation-triangle text-emerald-700 text-2xl"></i>
                        </div>
                        <div class="confirm-content">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">{{ message.header }}</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">{{ message.message }}</p>
                        </div>
                        <div class="confirm-actions flex gap-3 w-full mt-2">
                            <button @click="rejectCallback" class="viora-btn-secondary flex-1 h-11 rounded-xl font-semibold text-sm transition-all">
                                {{ t('iot-devices.cancel') }}
                            </button>
                            <button @click="acceptCallback" class="viora-btn-primary-confirm flex-1 h-11 rounded-xl font-semibold text-sm transition-all">
                                {{ t('iot-devices.delete') }}
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </pv-confirm-dialog>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

.iot-devices-container {
    width: 100%;
    font-family: 'Poppins', sans-serif;
}

.dashboard-toolbar {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.toolbar-side { flex: 1; display: flex; }
.toolbar-side.right-align { justify-content: flex-end; }
.toolbar-center { display: flex; justify-content: center; }

.viora-outline-btn-long {
    background: transparent !important;
    border: 1.5px solid #2E4A3A !important;
    color: #2E4A3A !important;
    border-radius: 8px !important;
    padding: 10px 24px !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    height: 42px;
}

.viora-outline-btn-long:hover {
    background: #2E4A3A !important;
    color: #ffffff !important;
}

.viora-table-card {
    border-radius: 12px;
    border: 1px solid #F0F0F3;
    background-color: #ffffff;
    overflow: hidden;
}

:deep(.p-card-content) { padding: 0 !important; }

.alerts-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow-x: auto;
}

.table-thead {
    display: flex;
    background-color: rgba(245, 245, 250, 0.4);
    padding: 12px 20px;
    border-bottom: 1px solid #F0F0F3;
}

.table-thead div {
    font-weight: 500;
    font-size: 11px;
    color: #333333;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
}

.table-row {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #F0F0F3;
    transition: background-color 0.2s;
}

.table-row:hover { background-color: #F9FAFB; }
.table-row:last-child { border-bottom: none; }

.col-name { flex: 2.5; min-width: 250px; display: flex; align-items: center; justify-content: flex-start; }
.col-plot { flex: 1.5; min-width: 150px; display: flex; align-items: center; justify-content: flex-start; }
.col-moisture { flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: flex-start; }
.col-temp { flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: flex-start; }
.col-leaf { flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: flex-start; }
.col-status { flex: 1.5; min-width: 140px; display: flex; align-items: center; justify-content: flex-start; }
.col-actions { flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: flex-start; gap: 4px; }

.cell-type { display: flex; align-items: center; gap: 15px; }
.icon-square {
    width: 52px;
    height: 52px;
    background-color: #F8F9FA;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.type-icon { font-size: 24px; color: #1C1D21; }
.type-text-wrapper { 
    display: flex; 
    flex-direction: column; 
    gap: 2px; 
    text-align: left;
}
.type-name { font-weight: 600; font-size: 14px; color: #1C1D21; text-align: left; }
.type-description { font-weight: 400; font-size: 11px; color: #6B7280; text-align: left; }

.viora-confirm-dialog {
    font-family: 'Poppins', sans-serif !important;
}

.confirm-icon-circle {
    margin: 0 auto;
}

.viora-btn-secondary {
    background: transparent;
    color: #9CA3AF;
    border: none;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    border-radius: 12px;
}

.viora-btn-secondary:hover {
    background: #F9FAFB;
    color: #4B5563;
}

.viora-btn-primary-confirm {
    background: transparent;
    color: #2E4A3A;
    border: none;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    border-radius: 12px;
    font-weight: 600;
}

.viora-btn-primary-confirm:hover {
    background: rgba(46, 74, 58, 0.08);
    transform: translateY(-1px);
}

.plot-name { font-weight: 600; font-size: 14px; color: #1C1D21; }

.status-label {
    width: 120px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    text-transform: capitalize;
}

.empty-msg { padding: 40px; text-align: center; color: #9CA3AF; }
.skeleton-row { height: 80px; margin: 10px 20px; background-color: #F9FAFB; border-radius: 8px; }

:deep(.viora-paginator) {
    background: transparent;
    border: none;
    padding: 0;
}

:deep(.viora-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    background: #F2F2F5;
    color: #2E4A3A;
}

:deep(.viora-paginator .p-link) {
    border-radius: 6px;
    min-width: 32px;
    height: 32px;
}
</style>