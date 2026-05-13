<script setup>
/**
 * IotDeviceForm component.
 * Provides a form interface for creating and updating IoT devices.
 * Coordinates with the Agronomic store for data persistence.
 *
 * @component
 */
import { useRoute, useRouter } from "vue-router";
import { useAgronomicStore } from "../../application/agronomic.store.js";
import { computed, onMounted, ref } from "vue";
import { IotDevice } from "../../domain/model/iot-device.entity.js";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAgronomicStore();
const { errors, addIotDevice, updateIotDevice, plots, fetchPlots } = store;

/** 
 * Local reactive state for the device form fields.
 * @type {import('vue').Ref<Object>} 
 */
const form = ref({
    name: '',
    plotId: null,
    soilMoisture: 0,
    temperature: 0,
    leafHumidity: 0,
    status: 'active'
});

/** 
 * Determines if the form is in edit mode based on route parameters.
 * @type {import('vue').ComputedRef<boolean>} 
 */
const isEdit = computed(() => !!route.params.id);

onMounted(() => {
    if (plots.length === 0) fetchPlots();
    
    if (isEdit.value) {
        const device = store.getIotDeviceById(route.params.id);
        if (device) form.value = { ...device }; else navigateBack();
    }
});

/** 
 * Persists the device data by either creating a new entity or updating an existing one.
 */
const saveDevice = () => {
    const deviceData = new IotDevice({
        ...form.value,
        id: isEdit.value ? Number(route.params.id) : null,
        lastUpdate: new Date()
    });
    
    if (isEdit.value) updateIotDevice(deviceData); else addIotDevice(deviceData);
    navigateBack();
};

/** 
 * Navigates back to the device list view.
 */
const navigateBack = () => router.push({ name: 'agronomic-iot-devices' });

/** 
 * Options for the device status dropdown.
 * @type {Array<{label: string, value: string}>} 
 */
const statusOptions = [
    { label: t('iot-devices.status.active'), value: 'active' },
    { label: t('iot-devices.status.warning'), value: 'warning' },
    { label: t('iot-devices.status.critical'), value: 'critical' }
];
</script>

<template>
    <div class="iot-device-form-container">
        <div class="form-card bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mx-auto">
            <div class="form-header-accent bg-gray-50/50 h-12 w-full border-b border-gray-50 flex items-center justify-center">
                <span class="text-[11px] font-semibold text-emerald-700 tracking-wider uppercase opacity-70">{{ isEdit ? t('iot-devices.edit-title') : t('iot-devices.new-title') }}</span>
            </div>
            <form @submit.prevent="saveDevice" class="px-8 pt-4 pb-4">
                <div class="form-content-centered mx-auto max-w-[490px]">
                    <div class="form-section mb-4">
                        <div class="section-title mb-3 flex items-center justify-center gap-2">
                            <i class="pi pi-info-circle text-emerald-600 text-[10px]"></i>
                            <span class="text-[10px] tracking-wide font-bold text-gray-400">General Information</span>
                        </div>

                        <div class="rows-container-flex">
                            <div class="form-row">
                                <label for="name" class="row-label">{{ t('iot-devices.fields.name') }}</label>
                                <div class="row-input">
                                    <pv-input-text id="name" v-model="form.name" class="viora-field fixed-width-field" :placeholder="t('iot-devices.placeholders.name')" required />
                                </div>
                            </div>

                            <div class="form-row">
                                <label for="plot" class="row-label">{{ t('iot-devices.fields.plot') }}</label>
                                <div class="row-input">
                                    <pv-dropdown id="plot" v-model="form.plotId" :options="plots" optionLabel="name" optionValue="id" 
                                                :placeholder="t('iot-devices.placeholders.plot')" class="viora-field fixed-width-field" required />
                                </div>
                            </div>

                            <div class="form-row">
                                <label for="status" class="row-label">{{ t('iot-devices.fields.status') }}</label>
                                <div class="row-input">
                                    <pv-dropdown id="status" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="viora-field fixed-width-field" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-section mb-0">
                        <div class="section-title mb-3 flex items-center justify-center gap-2">
                            <i class="pi pi-chart-bar text-emerald-600 text-[10px]"></i>
                            <span class="text-[10px] tracking-wide font-bold text-gray-400">Telemetry Calibration</span>
                        </div>

                        <div class="rows-container-flex">
                            <div class="form-row">
                                <label for="soilMoisture" class="row-label">{{ t('iot-devices.fields.soil-moisture') }}</label>
                                <div class="row-input">
                                    <pv-input-number id="soilMoisture" v-model="form.soilMoisture" class="viora-field fixed-width-field" :min="0" :max="100" suffix="%" />
                                </div>
                            </div>

                            <div class="form-row">
                                <label for="temperature" class="row-label">{{ t('iot-devices.fields.temperature') }}</label>
                                <div class="row-input">
                                    <pv-input-number id="temperature" v-model="form.temperature" class="viora-field fixed-width-field" suffix="°C" />
                                </div>
                            </div>

                            <div class="form-row">
                                <label for="leafHumidity" class="row-label">{{ t('iot-devices.fields.leaf-humidity') }}</label>
                                <div class="row-input">
                                    <pv-input-number id="leafHumidity" v-model="form.leafHumidity" class="viora-field fixed-width-field" :min="0" :max="100" suffix="%" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions mt-4 pt-4 border-t border-gray-50 flex items-center justify-center gap-6 w-full">
                    <pv-button :label="t('iot-devices.cancel')" class="p-button-link text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-4" @click="navigateBack" />
                    <button type="submit" class="viora-submit-btn-refined gap-2 h-9">
                        <i class="pi pi-check text-[10px]"></i>
                        <span>{{ t('iot-devices.save') }}</span>
                    </button>
                </div>
            </form>
        </div>

        <div v-if="errors.length" class="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-xl mx-auto max-w-[500px]">
            <p class="font-bold text-red-700 text-[10px]">{{ t('errors.occurred') }}</p>
            <ul class="list-disc ml-4 text-red-600 mt-1 text-[9px]">
                <li v-for="e in errors" :key="e.message">{{ typeof e === 'string' ? e : e.message }}</li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.iot-device-form-container {
    font-family: 'Poppins', sans-serif !important;
    margin-top: -45px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.form-card {
    width: 100%;
    max-width: 560px;
    box-sizing: border-box;
}

.form-content-centered {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.rows-container-flex {
    display: flex;
    flex-direction: column;
    gap: 5px !important;
}

.form-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    width: 100%;
    margin: 0 !important;
}

.row-label {
    flex: 0 0 140px;
    font-size: 13px;
    font-weight: 500;
    color: #4B5563;
    text-align: right;
}

.row-input {
    flex: 0 0 320px;
    display: flex;
    justify-content: flex-start;
}

.fixed-width-field {
    width: 320px !important;
    max-width: 320px !important;
}

:deep(*) {
    font-family: 'Poppins', sans-serif !important;
    text-transform: none !important;
    box-sizing: border-box !important;
}

:deep(.p-inputtext), 
:deep(.p-dropdown), 
:deep(.p-inputnumber-input) {
    border-radius: 12px !important;
    border: 1.5px solid #F0F0F3 !important;
    background-color: #ffffff !important;
    height: 38px !important;
    font-size: 13px !important;
    text-align: center !important;
    padding: 0 12px !important;
    transition: all 0.2s ease !important;
    margin: 0 !important;
}

:deep(.p-dropdown-label) {
    padding: 0 !important;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 13px !important;
}

:deep(.p-inputnumber) {
    border: none !important;
    background: transparent !important;
    margin: 0 !important;
}

:deep(.p-inputtext:hover), :deep(.p-dropdown:hover), :deep(.p-inputnumber-input:hover) {
    border-color: #2E4A3A !important;
}

.viora-submit-btn-refined {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2E4A3A !important;
    border: none;
    border-radius: 20px;
    color: white !important;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(46, 74, 58, 0.2);
    padding: 0 32px;
}

.viora-submit-btn-refined:hover {
    background-color: #243b2e !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(46, 74, 58, 0.3);
}

:deep(.p-button-link) {
    text-decoration: none !important;
    color: #9CA3AF !important;
}

:deep(.p-button-link:hover) {
    color: #4B5563 !important;
}
</style>