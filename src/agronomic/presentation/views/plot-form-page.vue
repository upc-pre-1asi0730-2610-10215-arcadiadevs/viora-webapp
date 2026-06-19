<script setup>
/**
 * PlotFormPage.
 * Create-plot wizard reused for editing: a two-pane form (basic info + boundary
 * draw map) with a stepper and a post-registration confirmation step. In edit
 * mode (`:id` route param) it preloads the form and boundary from the plot and
 * PATCHes instead of POSTing. Mirrors the OS Angular `PlotCreate`.
 *
 * @component
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { AgronomicApi } from '../../infrastructure/agronomic-api.js';
import { PlotRegistrationAssembler } from '../../infrastructure/plot-registration.assembler.js';
import PlotBoundaryMap from '../components/plot-boundary-map.vue';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const agronomicApi = new AgronomicApi();

/** AgroMonitoring rejects polygons below 1 ha (no satellite/NDVI coverage). */
const MIN_AREA_HECTARES = 1;

const editPlotId = route.params.id ?? null;
const isEditMode = computed(() => editPlotId !== null && editPlotId !== undefined);

const boundaryMapRef = ref(null);
const boundaryToLoad = ref(null);

const form = ref({ name: '', cropType: '', campaign: '', location: '', notes: '' });
const nameTouched = ref(false);

const boundaryPoints = ref([]);
const boundaryClosed = ref(false);
const boundaryArea = ref(0);
const addMode = ref(true);
const registerAttempted = ref(false);

const saving = ref(false);
const errors = ref([]);
const registration = ref(null);

const pointCount = computed(() => boundaryPoints.value.length);

const nameValid = computed(() => {
  const value = form.value.name.trim();
  return value.length >= 3 && value.length <= 80;
});

const basicInfoValid = computed(() => nameValid.value);

const areaTooSmall = computed(() => boundaryClosed.value && boundaryArea.value < MIN_AREA_HECTARES);

const showBoundaryError = computed(() => !boundaryClosed.value && pointCount.value > 0);

const estimatedAreaLabel = computed(() =>
    boundaryClosed.value ? `${boundaryArea.value.toFixed(1)} ha` : '—'
);

const titleKey = computed(() => (isEditMode.value ? 'plotCreate.edit.title' : 'plotCreate.title'));
const subtitleKey = computed(() => (isEditMode.value ? 'plotCreate.edit.subtitle' : 'plotCreate.subtitle'));

const errorMessage = computed(() => {
  const error = errors.value[0];
  if (!error) return '';

  if (error.response?.status === 400) {
    return 'The plot could not be registered. Check that the polygon is closed and the area is valid.';
  }

  if (error.response?.status === 404) {
    return 'The requested plot was not found in the platform.';
  }

  return error.message || 'The platform could not complete the request.';
});

const hasNameError = computed(() => nameTouched.value && !nameValid.value);

const registerIcon = computed(() => {
  if (saving.value) return 'pi-spin pi-spinner';
  if (!boundaryClosed.value || areaTooSmall.value) return 'pi-lock';
  return isEditMode.value ? 'pi-save' : 'pi-check';
});

const registerLabel = computed(() => {
  if (saving.value) {
    return isEditMode.value ? t('plotCreate.edit.saving') : t('plotCreate.boundary.registering');
  }
  if (!boundaryClosed.value) return t('plotCreate.boundary.registerLocked');
  if (areaTooSmall.value) return t('plotCreate.boundary.registerTooSmall');
  return isEditMode.value ? t('plotCreate.edit.save') : t('plotCreate.boundary.register');
});

const steps = computed(() => {
  const registered = registration.value !== null;
  const basicDone = basicInfoValid.value;
  const boundaryDone = boundaryClosed.value;

  const basicState = registered || basicDone ? 'done' : 'active';
  const boundaryState = registered || boundaryDone ? 'done' : basicDone ? 'active' : 'pending';
  const confirmState = registered ? 'done' : 'pending';

  return [
    { id: 'basic', labelKey: 'plotCreate.steps.basicInfo', state: basicState, index: 1 },
    { id: 'boundary', labelKey: 'plotCreate.steps.boundary', state: boundaryState, index: 2 },
    { id: 'confirm', labelKey: 'plotCreate.steps.confirm', state: confirmState, index: 3 }
  ];
});

// ----- Boundary toolbar actions -----

const onBoundaryChange = (state) => {
  boundaryPoints.value = state.points;
  boundaryClosed.value = state.closed;
  boundaryArea.value = state.areaHectares;
  addMode.value = state.addMode;
  if (state.closed) registerAttempted.value = false;
};

const toggleAddPoint = () => boundaryMapRef.value?.toggleAddMode();
const undoPoint = () => boundaryMapRef.value?.undo();
const clearBoundary = () => boundaryMapRef.value?.clear();
const closePolygon = () => boundaryMapRef.value?.close();

const continueDrawing = () => {
  registerAttempted.value = false;
  if (!addMode.value) boundaryMapRef.value?.toggleAddMode();
};

// ----- Link status helpers (confirmation step) -----

const linkLabel = (status) => {
  switch (status) {
    case 'active':
      return t('plotCreate.linkStatus.active');
    case 'initializing':
      return t('plotCreate.linkStatus.initializing');
    case 'not-linked':
      return t('plotCreate.linkStatus.notLinked');
    default:
      return t('plotCreate.linkStatus.pending');
  }
};

const linkClass = (status) => {
  switch (status) {
    case 'active':
      return 'tag-active';
    case 'not-linked':
      return 'tag-dark';
    default:
      return 'tag-init';
  }
};

const optional = (value) => {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

// ----- Registration -----

const registerPlot = async () => {
  if (!basicInfoValid.value) {
    nameTouched.value = true;
    return;
  }
  if (!boundaryClosed.value || areaTooSmall.value) {
    registerAttempted.value = true;
    return;
  }

  const raw = form.value;
  const points = boundaryPoints.value;
  const polygonCoordinates = [...points, points[0]];

  saving.value = true;
  errors.value = [];

  try {
    if (isEditMode.value) {
      await agronomicApi.updatePlot(editPlotId, {
        name: raw.name.trim(),
        polygonCoordinates,
        cropType: raw.cropType.trim(),
        campaign: raw.campaign.trim(),
        location: raw.location.trim(),
        notes: raw.notes.trim()
      });
      await router.push(`/dashboard/plot-overview/${editPlotId}`);
      return;
    }

    const response = await agronomicApi.createPlot({
      name: raw.name.trim(),
      polygonCoordinates,
      cropType: optional(raw.cropType),
      campaign: optional(raw.campaign),
      location: optional(raw.location),
      notes: optional(raw.notes)
    });
    registration.value = PlotRegistrationAssembler.toEntityFromResource(response.data);
  } catch (error) {
    errors.value.push(error);
  } finally {
    saving.value = false;
  }
};

const resetWizard = () => {
  form.value = { name: '', cropType: '', campaign: '', location: '', notes: '' };
  nameTouched.value = false;
  registerAttempted.value = false;
  registration.value = null;
  boundaryMapRef.value?.clear();
};

const viewPlotDetail = () => {
  const id = registration.value?.id;
  router.push(id != null ? `/dashboard/plot-overview/${id}` : '/agronomic/plots');
};

const preloadForEdit = async () => {
  if (!isEditMode.value) return;
  try {
    const response = await agronomicApi.getPlotById(editPlotId);
    const data = response?.data ?? {};
    form.value = {
      name: data.name ?? '',
      cropType: data.cropType ?? '',
      campaign: data.campaign ?? '',
      location: data.location ?? data.locationReference ?? '',
      notes: data.notes ?? ''
    };
    if (Array.isArray(data.polygonCoordinates) && data.polygonCoordinates.length >= 3) {
      boundaryToLoad.value = data.polygonCoordinates;
    }
  } catch (error) {
    errors.value.push(error);
  }
};

onMounted(preloadForEdit);
</script>

<template>
  <section class="create-page">
    <!-- Header -->
    <header class="create-header">
      <div class="header-left">
        <router-link to="/agronomic/plots" class="back-button" :aria-label="t('plotCreate.confirm.back')">
          <i class="pi pi-arrow-left"></i>
        </router-link>
        <div>
          <h1 class="header-title">
            {{ t('sidebar.myPlots') }}
            <span class="title-sep">/</span>
            {{ t(titleKey) }}
          </h1>
          <p class="header-subtitle">{{ t(subtitleKey) }}</p>
        </div>
      </div>

      <div class="header-right">
        <LanguageSwitcher />
        <button v-if="!isEditMode" type="button" class="reset-button" :aria-label="t('plotCreate.reset')" @click="resetWizard">
          <i class="pi pi-refresh"></i>
        </button>
      </div>
    </header>

    <!-- Stepper -->
    <nav class="stepper" aria-label="Create plot steps">
      <template v-for="(step, index) in steps" :key="step.id">
        <div class="step" :class="{ 'is-done': step.state === 'done', 'is-active': step.state === 'active' }">
          <span class="step-marker">
            <i v-if="step.state === 'done'" class="pi pi-check"></i>
            <template v-else>{{ step.index }}</template>
          </span>
          <span class="step-label">{{ t(step.labelKey) }}</span>
        </div>
        <span v-if="index < steps.length - 1" class="step-line"></span>
      </template>
    </nav>

    <!-- Step 3: Confirmation -->
    <article v-if="registration" class="confirm-card">
      <div class="confirm-icon">
        <i class="pi pi-check-circle"></i>
      </div>

      <h2 class="confirm-title">{{ t('plotCreate.confirm.title') }}</h2>
      <p class="confirm-sub">{{ t('plotCreate.confirm.subtitle', { name: registration.name }) }}</p>

      <div class="confirm-summary">
        <div class="summary-line">
          <span>{{ t('plotCreate.confirm.plot') }}</span>
          <strong>{{ registration.name }}</strong>
        </div>
        <div class="summary-line">
          <span>{{ t('plotCreate.fields.location') }}</span>
          <strong>{{ registration.location || '—' }}</strong>
        </div>
        <div class="summary-line">
          <span>{{ t('plotCreate.confirm.area') }}</span>
          <strong>{{ registration.areaLabel }}</strong>
        </div>

        <div class="summary-divider"></div>

        <div class="link-line">
          <span class="link-name"><i class="pi pi-cloud"></i> {{ t('plotCreate.links.climate') }}</span>
          <span class="link-tag" :class="linkClass(registration.climateMonitoring)">{{ linkLabel(registration.climateMonitoring) }}</span>
        </div>
        <div class="link-line">
          <span class="link-name"><i class="pi pi-globe"></i> {{ t('plotCreate.links.ndvi') }}</span>
          <span class="link-tag" :class="linkClass(registration.satelliteNdvi)">{{ linkLabel(registration.satelliteNdvi) }}</span>
        </div>
        <div class="link-line">
          <span class="link-name"><i class="pi pi-wifi"></i> {{ t('plotCreate.links.iot') }}</span>
          <span class="link-tag" :class="linkClass(registration.iotDevices)">{{ linkLabel(registration.iotDevices) }}</span>
        </div>
      </div>

      <p class="field-info">
        <i class="pi pi-info-circle"></i> {{ t('plotCreate.confirm.note') }}
      </p>

      <button type="button" class="primary-button" @click="viewPlotDetail">
        <i class="pi pi-eye"></i> {{ t('plotCreate.confirm.viewDetail') }}
      </button>
      <router-link to="/agronomic/plots" class="ghost-button wide">
        <i class="pi pi-arrow-left"></i> {{ t('plotCreate.confirm.back') }}
      </router-link>
    </article>

    <!-- Steps 1-2 -->
    <div v-else class="wizard-grid">
      <!-- Left: Basic info -->
      <article class="info-card">
        <h2 class="card-title">{{ t('plotCreate.info.title') }}</h2>
        <p class="card-subtitle">{{ t('plotCreate.info.subtitle') }}</p>
        <div class="card-divider"></div>

        <form class="plot-form" @submit.prevent>
          <label class="field-label">{{ t('plotCreate.fields.name') }}</label>
          <input
              v-model="form.name"
              class="field"
              :class="{ 'has-error': hasNameError }"
              :placeholder="t('plotCreate.placeholders.name')"
              @blur="nameTouched = true"
          />
          <span v-if="hasNameError" class="field-error">{{ t('plotCreate.errors.name') }}</span>

          <div class="field-row">
            <div class="field-col">
              <label class="field-label">{{ t('plotCreate.fields.cropType') }}</label>
              <input v-model="form.cropType" class="field" :placeholder="t('plotCreate.placeholders.cropType')" />
            </div>
            <div class="field-col">
              <label class="field-label">{{ t('plotCreate.fields.campaign') }}</label>
              <input v-model="form.campaign" class="field" :placeholder="t('plotCreate.placeholders.campaign')" />
            </div>
          </div>

          <label class="field-label">{{ t('plotCreate.fields.location') }}</label>
          <input v-model="form.location" class="field" :placeholder="t('plotCreate.placeholders.location')" />

          <label class="field-label">{{ t('plotCreate.fields.notes') }}</label>
          <textarea v-model="form.notes" rows="2" class="field" :placeholder="t('plotCreate.placeholders.notes')"></textarea>

          <template v-if="!isEditMode">
            <div class="card-divider"></div>

            <h3 class="links-title">{{ t('plotCreate.links.title') }}</h3>
            <div class="link-line">
              <span class="link-name"><i class="pi pi-cloud"></i> {{ t('plotCreate.links.climate') }}</span>
              <span class="link-tag tag-will">{{ t('plotCreate.links.willActivate') }}</span>
            </div>
            <div class="link-line">
              <span class="link-name"><i class="pi pi-globe"></i> {{ t('plotCreate.links.ndvi') }}</span>
              <span class="link-tag tag-will">{{ t('plotCreate.links.willActivate') }}</span>
            </div>
            <div class="link-line">
              <span class="link-name"><i class="pi pi-wifi"></i> {{ t('plotCreate.links.iot') }}</span>
              <span class="link-tag tag-dark">{{ t('plotCreate.links.linkFromDetail') }}</span>
            </div>
          </template>
        </form>
      </article>

      <!-- Right: Boundary -->
      <article class="boundary-card">
        <h2 class="card-title">{{ t('plotCreate.boundary.title') }}</h2>
        <p class="card-subtitle">{{ t('plotCreate.boundary.subtitle') }}</p>

        <div class="map-wrap">
          <PlotBoundaryMap ref="boundaryMapRef" :initial-boundary="boundaryToLoad" @boundary-change="onBoundaryChange" />
        </div>

        <div class="map-actions">
          <button type="button" class="ghost-button" :class="{ 'is-active': addMode }" @click="toggleAddPoint">
            <i class="pi pi-map-marker"></i> {{ t('plotCreate.boundary.addPoint') }}
          </button>
          <button type="button" class="ghost-button" @click="undoPoint">
            <i class="pi pi-replay"></i> {{ t('plotCreate.boundary.undoPoint') }}
          </button>
          <button type="button" class="ghost-button" @click="clearBoundary">
            <i class="pi pi-trash"></i> {{ t('plotCreate.boundary.clear') }}
          </button>
          <button type="button" class="ghost-button" @click="closePolygon">
            <i class="pi pi-sitemap"></i> {{ t('plotCreate.boundary.close') }}
          </button>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span class="summary-title">{{ t('plotCreate.boundary.pointsSelected') }}</span>
            <span class="summary-number">{{ pointCount }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-title">{{ t('plotCreate.boundary.estimatedArea') }}</span>
            <span class="summary-number">{{ estimatedAreaLabel }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-title">{{ t('plotCreate.boundary.boundaryStatus') }}</span>
            <span class="summary-tag" :class="{ 'is-closed': boundaryClosed, 'is-open': !boundaryClosed }">
              {{ boundaryClosed ? t('plotCreate.boundary.closed') : t('plotCreate.boundary.open') }}
            </span>
          </div>
        </div>

        <div v-if="showBoundaryError" class="boundary-error">
          <div class="error-head">
            <i class="pi pi-exclamation-triangle"></i> {{ t('plotCreate.boundary.incompleteTitle') }}
          </div>
          <p>{{ t('plotCreate.boundary.incompleteBody') }}</p>
          <button type="button" class="ghost-button" @click="continueDrawing">
            <i class="pi pi-pencil"></i> {{ t('plotCreate.boundary.continueDrawing') }}
          </button>
        </div>
        <div v-else-if="areaTooSmall" class="boundary-error">
          <div class="error-head">
            <i class="pi pi-exclamation-triangle"></i> {{ t('plotCreate.boundary.tooSmallTitle') }}
          </div>
          <p>{{ t('plotCreate.boundary.tooSmallBody', { area: boundaryArea.toFixed(2) }) }}</p>
        </div>
        <p v-else class="field-info">
          <i class="pi pi-info-circle"></i> {{ t('plotCreate.boundary.autoLinkNote') }}
        </p>

        <button
            type="button"
            class="register-button"
            :disabled="!boundaryClosed || areaTooSmall || saving"
            @click="registerPlot"
        >
          <i class="pi" :class="registerIcon"></i> {{ registerLabel }}
        </button>
      </article>
    </div>

    <section v-if="errors.length > 0 && !registration" class="error-box">
      <strong>{{ errorMessage }}</strong>
    </section>
  </section>
</template>

<style scoped>
.create-page {
  width: 100%;
  font-family: 'Poppins', sans-serif;
  color: #1f2523;
}

/* ---------- Header ---------- */
.create-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button,
.reset-button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid #d8d3cb;
  border-radius: 10px;
  background: transparent;
  color: #2e4a3a;
  text-decoration: none;
  cursor: pointer;
}

.back-button:hover,
.reset-button:hover {
  background: #f3f6f2;
}

.header-title {
  margin: 0;
  font-weight: 500;
  font-size: 20px;
  color: #333333;
}

.title-sep {
  color: #333333;
  font-weight: 500;
}

.header-subtitle {
  margin: 4px 0 0;
  font-weight: 400;
  font-size: 12px;
  color: #4f4f4f;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ---------- Stepper ---------- */
.stepper {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding: 0 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e6e2db;
  color: #8c877f;
  font-weight: 600;
  font-size: 13px;
}

.step-marker i {
  font-size: 14px;
}

.step.is-done .step-marker {
  background: #2e4a3a;
  color: #ffffff;
}

.step.is-active .step-marker {
  background: #ffffff;
  border: 2px solid #2e4a3a;
  color: #2e4a3a;
}

.step-label {
  font-weight: 500;
  font-size: 14px;
  color: #8c877f;
}

.step.is-done .step-label,
.step.is-active .step-label {
  color: #1f2523;
}

.step-line {
  flex: 1;
  height: 1px;
  background: #d8d3cb;
}

/* ---------- Wizard grid ---------- */
.wizard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.info-card,
.boundary-card {
  padding: 26px 28px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.card-title {
  margin: 0;
  font-weight: 600;
  font-size: 18px;
  color: #1f2523;
}

.card-subtitle {
  margin: 6px 0 0;
  font-weight: 400;
  font-size: 14px;
  color: #4f4f4f;
}

.card-divider {
  height: 1px;
  background: #ece8e1;
  margin: 18px 0;
}

/* ---------- Form ---------- */
.plot-form {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: block;
  margin: 16px 0 6px;
  font-weight: 500;
  font-size: 16px;
  color: #1f2523;
}

.field {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #e0dbd2;
  border-radius: 10px;
  background: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #4f4f4f;
  outline: none;
  resize: vertical;
}

.field::placeholder {
  color: #828282;
}

.field:focus {
  border-color: #2e4a3a;
}

.field.has-error {
  border-color: #d84141;
}

.field-error {
  margin-top: 6px;
  font-size: 11px;
  color: #d84141;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-weight: 400;
  font-size: 10px;
  color: #4f4f4f;
}

.field-info i {
  font-size: 13px;
  color: #8c877f;
}

/* ---------- Automatic links ---------- */
.links-title {
  margin: 0 0 12px;
  font-weight: 500;
  font-size: 14px;
  color: #1f2523;
}

.link-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.link-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 400;
  font-size: 14px;
  color: #4f4f4f;
}

.link-name i {
  font-size: 16px;
  color: #6b716d;
}

.link-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
}

.tag-will,
.tag-active {
  background: #57eba1;
  color: #2e4a3a;
}

.tag-init {
  background: #9ff0c6;
  color: #2e4a3a;
}

.tag-dark {
  background: #1f2c26;
  color: #ffffff;
}

/* ---------- Boundary map ---------- */
.map-wrap {
  margin: 18px 0 16px;
}

.map-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #2e4a3a;
  border-radius: 8px;
  background: #ffffff;
  color: #2e4a3a;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
}

.ghost-button i {
  font-size: 16px;
}

.ghost-button:hover,
.ghost-button.is-active {
  background: #f3f6f2;
}

/* ---------- Summary cards ---------- */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: #f3efe8;
  border-radius: 12px;
}

.summary-title {
  font-weight: 400;
  font-size: 14px;
  color: #4f4f4f;
}

.summary-number {
  font-weight: 500;
  font-size: 20px;
  color: #4f4f4f;
}

.summary-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
}

.summary-tag.is-closed {
  background: #57eba1;
  color: #2e4a3a;
}

.summary-tag.is-open {
  background: #ff5c5c;
  color: #ffffff;
}

/* ---------- Boundary error ---------- */
.boundary-error {
  padding: 16px 18px;
  margin-bottom: 16px;
  background: #fdecec;
  border-radius: 12px;
}

.error-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #d84141;
}

.error-head i {
  font-size: 16px;
}

.boundary-error p {
  margin: 8px 0 12px;
  font-weight: 400;
  font-size: 12px;
  color: #c0504d;
}

.boundary-error .ghost-button {
  border-color: #d84141;
  color: #d84141;
  background: #ffffff;
}

/* ---------- Register / primary buttons ---------- */
.register-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #2e4a3a;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
}

.register-button:disabled {
  background: #e2ded7;
  color: #9a958c;
  cursor: not-allowed;
}

/* ---------- Confirmation step ---------- */
.confirm-card {
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 34px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
  text-align: center;
}

.confirm-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #dff3e8;
}

.confirm-icon i {
  font-size: 34px;
  color: #2e4a3a;
}

.confirm-title {
  margin: 0;
  font-weight: 600;
  font-size: 20px;
  color: #1f2523;
}

.confirm-sub {
  margin: 8px auto 22px;
  max-width: 420px;
  font-weight: 400;
  font-size: 14px;
  color: #4f4f4f;
}

.confirm-summary {
  padding: 18px 20px;
  margin-bottom: 16px;
  background: #f3efe8;
  border-radius: 12px;
  text-align: left;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: #4f4f4f;
}

.summary-line strong {
  font-weight: 500;
  color: #1f2523;
}

.summary-divider {
  height: 1px;
  background: #e0dbd2;
  margin: 12px 0;
}

.primary-button {
  margin-bottom: 12px;
}

.ghost-button.wide {
  width: 100%;
  height: 44px;
}

.error-box {
  margin-top: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  background: #fdecea;
  color: #b3261e;
  font-size: 13px;
}

/* ---------- Responsive ---------- */
@media (max-width: 980px) {
  .wizard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .field-row,
  .map-actions {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
