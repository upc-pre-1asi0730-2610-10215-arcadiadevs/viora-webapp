<script setup>
/**
 * LocationPickerModal.
 * Reusable Mapbox picker for selecting a base service location.
 *
 * @component
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { mapboxService } from '../../infrastructure/mapbox.service.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const DEFAULT_CENTER = [-75.0152, -9.19];

const props = defineProps({
    initialLat: { type: Number, default: null },
    initialLng: { type: Number, default: null },
});

const emit = defineEmits(['confirmed', 'dismissed']);
const { t } = useI18n();

const mapContainer = ref(null);
const searchTerm = ref('');
const selectedLabel = ref('');
const resolving = ref(false);
const mapUnavailable = ref(!MAPBOX_TOKEN || MAPBOX_TOKEN === 'tu_token_aqui');

let map = null;
let marker = null;
let lat = 0;
let lng = 0;

const hasInitial = computed(() => props.initialLat != null && props.initialLng != null);
const selectedCoordsLabel = computed(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
});

function geocodingUrl(query) {
    return (
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
        `?limit=1&access_token=${MAPBOX_TOKEN}`
    );
}

function setPoint(nextLat, nextLng, resolveLabel = false) {
    lat = nextLat;
    lng = nextLng;
    marker?.setLngLat([lng, lat]);
    if (resolveLabel) reverseGeocode();
}

async function fetchFirstFeature(query) {
    const response = await fetch(geocodingUrl(query));
    if (!response.ok) return null;
    const data = await response.json();
    return data.features?.[0] ?? null;
}

async function onSearch() {
    const term = searchTerm.value.trim();
    if (!term || mapUnavailable.value) return;

    resolving.value = true;
    try {
        const feature = await fetchFirstFeature(term);
        if (feature?.center) {
            const [nextLng, nextLat] = feature.center;
            map?.flyTo({ center: [nextLng, nextLat], zoom: 11 });
            setPoint(nextLat, nextLng);
            selectedLabel.value = feature.place_name ?? '';
        }
    } finally {
        resolving.value = false;
    }
}

async function reverseGeocode() {
    if (mapUnavailable.value) return;

    resolving.value = true;
    try {
        const feature = await fetchFirstFeature(`${lng},${lat}`);
        selectedLabel.value = feature?.place_name ?? '';
    } finally {
        resolving.value = false;
    }
}

function confirm() {
    emit('confirmed', {
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        label: selectedLabel.value.trim(),
    });
}

function dismiss() {
    emit('dismissed');
}

onMounted(async () => {
    if (mapUnavailable.value || !mapContainer.value) return;

    const center = hasInitial.value ? [props.initialLng, props.initialLat] : DEFAULT_CENTER;
    lng = center[0];
    lat = center[1];

    try {
        map = await mapboxService.createMapInstance({
            container: mapContainer.value,
            center,
            zoom: hasInitial.value ? 11 : 4,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            attributionControl: false,
        });
        const mapboxgl = window.mapboxgl;
        marker = new mapboxgl.Marker({ color: '#2e4a3a', draggable: true })
            .setLngLat(center)
            .addTo(map);
        marker.on('dragend', () => {
            const position = marker?.getLngLat();
            if (position) setPoint(position.lat, position.lng, true);
        });
        map.on('click', (event) => setPoint(event.lngLat.lat, event.lngLat.lng, true));
        map.on('error', () => {
            mapUnavailable.value = true;
        });
        if (hasInitial.value) reverseGeocode();
        await nextTick();
        [200, 600].forEach((delay) => setTimeout(() => map?.resize(), delay));
    } catch {
        mapUnavailable.value = true;
    }
});

onBeforeUnmount(() => {
    marker?.remove();
    map?.remove();
    marker = null;
    map = null;
});
</script>

<template>
  <div class="picker-overlay" @click="dismiss">
    <div class="picker" @click.stop>
      <div class="picker-head">
        <div>
          <h2>{{ t('locationPicker.title') }}</h2>
          <p class="picker-sub">{{ t('locationPicker.subtitle') }}</p>
        </div>
        <button type="button" class="picker-close" :aria-label="t('locationPicker.close')" @click="dismiss">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div v-if="mapUnavailable" class="picker-unavailable">
        <i class="pi pi-map"></i>
        <p>{{ t('locationPicker.unavailable') }}</p>
      </div>

      <template v-else>
        <div class="picker-search">
          <i class="pi pi-search"></i>
          <input
            v-model="searchTerm"
            type="text"
            :placeholder="t('locationPicker.searchPlaceholder')"
            @keydown.enter.prevent="onSearch"
          />
          <button type="button" class="search-btn" :disabled="resolving" @click="onSearch">
            {{ t('locationPicker.search') }}
          </button>
        </div>

        <div ref="mapContainer" class="picker-map"></div>

        <div class="picker-selected">
          <i class="pi pi-map-marker"></i>
          <span v-if="resolving">{{ t('locationPicker.resolving') }}</span>
          <span v-else-if="selectedLabel">{{ selectedLabel }}</span>
          <span v-else-if="selectedCoordsLabel">{{ selectedCoordsLabel }}</span>
          <span v-else>{{ t('locationPicker.pickHint') }}</span>
        </div>
      </template>

      <div class="picker-actions">
        <button type="button" class="btn-ghost" @click="dismiss">{{ t('locationPicker.cancel') }}</button>
        <button v-if="!mapUnavailable" type="button" class="btn-primary" @click="confirm">
          <i class="pi pi-check"></i>
          {{ t('locationPicker.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(24, 34, 29, 0.42);
}

.picker {
  width: min(640px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 26px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(24, 34, 29, 0.24);
  font-family: 'Poppins', sans-serif;
  color: #18221d;
}

.picker-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.picker-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.picker-sub {
  margin: 4px 0 0;
  color: #6b716d;
  font-size: 12px;
}

.picker-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b716d;
  cursor: pointer;
}

.picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  border: 1px solid #ddd7cd;
  border-radius: 10px;
}

.picker-search i {
  color: #9a9187;
  font-size: 16px;
}

.picker-search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #18221d;
  background: transparent;
}

.search-btn,
.btn-ghost,
.btn-primary {
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.search-btn {
  padding: 8px 14px;
  background: #eef2ea;
  color: #2e4a3a;
}

.search-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.picker-map {
  width: 100%;
  height: 340px;
  border-radius: 12px;
  overflow: hidden;
  background: #eceae5;
}

.picker-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8f4ed;
  color: #4f5651;
  font-size: 13px;
}

.picker-selected i {
  color: #2e4a3a;
}

.picker-unavailable {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 24px;
  color: #6b716d;
  text-align: center;
}

.picker-unavailable i {
  font-size: 32px;
  color: #c8c2b8;
}

.picker-unavailable p {
  margin: 0;
  font-size: 13px;
  max-width: 380px;
}

.picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-ghost,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
}

.btn-ghost {
  background: #ffffff;
  color: #4f5651;
  border: 1px solid #ddd7cd;
}

.btn-primary {
  background: #2e4a3a;
  color: #ffffff;
}

@media (max-width: 640px) {
  .picker-overlay {
    padding: 14px;
  }

  .picker {
    padding: 20px;
  }

  .picker-search {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .picker-search input {
    flex-basis: calc(100% - 24px);
  }

  .search-btn {
    width: 100%;
  }

  .picker-map {
    height: 300px;
  }
}
</style>
