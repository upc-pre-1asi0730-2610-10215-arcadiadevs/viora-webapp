<script setup>
/**
 * PlotBoundaryMap component.
 * Interactive Mapbox surface to draw a plot's boundary polygon. Map clicks add
 * vertices while the polygon is open and "add mode" is active; vertices are
 * draggable. The parent drives the toolbar actions through the exposed methods
 * and reads live state via the `boundaryChange` emit. Ported from the OS Angular
 * `PlotBoundaryMap`, reusing the shared AW `mapboxService`.
 *
 * @component
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { mapboxService } from '../../../shared/infrastructure/mapbox.service.js';
import { polygonAreaHectares } from '../../infrastructure/geo-area.js';

const { t } = useI18n();

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const LINE_SOURCE = 'plot-boundary-line';
const FILL_SOURCE = 'plot-boundary-fill';
const CLOSED_COLOR = '#2e4a3a';
const OPEN_COLOR = '#ff5c5c';
// Default view centered on Tacna, Perú (the producer's region).
const DEFAULT_CENTER = [-70.2536, -18.0146];

const props = defineProps({
  /**
   * Existing polygon to preload when editing a plot (stored coordinates with the
   * repeated closing vertex). Seeds a closed, editable boundary once ready.
   */
  initialBoundary: {
    type: Array,
    default: null
  }
});

const emit = defineEmits(['boundaryChange']);

const mapContainer = ref(null);
const searchTerm = ref('');
const suggestions = ref([]);
const closedState = ref(false);
const locationLabel = ref('');
const hasToken = Boolean(MAPBOX_TOKEN);

let map = null;
let mapboxgl = null;
let ready = false;
let points = [];
let closed = false;
let addMode = true;
let markers = [];
let pendingInitial = null;
let initialApplied = false;
let searchTimer = null;
let centerTimer = null;

const emptyCollection = () => ({ type: 'FeatureCollection', features: [] });

/** Emits the current boundary state to the parent. */
const emitState = () => {
  closedState.value = closed;
  emit('boundaryChange', {
    points: [...points],
    closed,
    areaHectares: points.length >= 3 ? polygonAreaHectares(points) : 0,
    addMode
  });
};

const clearMarkers = () => {
  markers.forEach((marker) => marker.remove());
  markers = [];
};

const applyCursor = () => {
  if (!map) return;
  map.getCanvas().style.cursor = addMode && !closed ? 'crosshair' : '';
};

const setupLayers = () => {
  if (!map) return;

  map.addSource(FILL_SOURCE, { type: 'geojson', data: emptyCollection() });
  map.addLayer({
    id: `${FILL_SOURCE}-layer`,
    type: 'fill',
    source: FILL_SOURCE,
    paint: { 'fill-color': CLOSED_COLOR, 'fill-opacity': 0.25 }
  });

  map.addSource(LINE_SOURCE, { type: 'geojson', data: emptyCollection() });
  map.addLayer({
    id: `${LINE_SOURCE}-layer`,
    type: 'line',
    source: LINE_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': OPEN_COLOR, 'line-width': 2.5 }
  });
};

const renderGeometry = () => {
  if (!map || !ready) return;

  const lineLayer = `${LINE_SOURCE}-layer`;
  map.setPaintProperty(lineLayer, 'line-color', closed ? CLOSED_COLOR : OPEN_COLOR);
  map.setPaintProperty(lineLayer, 'line-dasharray', closed ? [1] : [2, 1.5]);

  const lineCoords = closed && points.length >= 3 ? [...points, points[0]] : points;

  map.getSource(LINE_SOURCE).setData(
      lineCoords.length >= 2
          ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: lineCoords } }
          : emptyCollection()
  );

  map.getSource(FILL_SOURCE).setData(
      closed && points.length >= 3
          ? {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [[...points, points[0]]] }
          }
          : emptyCollection()
  );
};

const renderMarkers = () => {
  if (!map || !mapboxgl) return;

  clearMarkers();
  const color = closed ? CLOSED_COLOR : OPEN_COLOR;

  points.forEach((point, index) => {
    const element = document.createElement('div');
    element.style.width = '14px';
    element.style.height = '14px';
    element.style.borderRadius = '50%';
    element.style.background = '#ffffff';
    element.style.border = `3px solid ${color}`;
    element.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.35)';
    element.style.cursor = 'grab';

    const marker = new mapboxgl.Marker({ element, draggable: true })
        .setLngLat(point)
        .addTo(map);

    marker.on('dragstart', () => { element.style.cursor = 'grabbing'; });
    marker.on('drag', () => {
      const position = marker.getLngLat();
      points[index] = [position.lng, position.lat];
      renderGeometry();
    });
    marker.on('dragend', () => {
      element.style.cursor = 'grab';
      const position = marker.getLngLat();
      points[index] = [position.lng, position.lat];
      refresh();
    });

    markers.push(marker);
  });
};

const refresh = () => {
  renderGeometry();
  renderMarkers();
  emitState();
};

// ----- Public API used by the wizard toolbar -----

const toggleAddMode = () => {
  addMode = !addMode;
  applyCursor();
  emitState();
};

const undo = () => {
  if (points.length === 0) return;
  points = points.slice(0, -1);
  closed = false;
  refresh();
};

const clear = () => {
  points = [];
  closed = false;
  refresh();
};

const close = () => {
  if (points.length < 3) return;
  closed = true;
  refresh();
};

defineExpose({ toggleAddMode, undo, clear, close });

// ----- Edit-mode preload -----

const stripClosingPoint = (boundary) => {
  if (boundary.length >= 2) {
    const first = boundary[0];
    const last = boundary[boundary.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      return boundary.slice(0, -1);
    }
  }
  return boundary;
};

const fitToPoints = (ring) => {
  if (!map || !mapboxgl || ring.length === 0) return;
  const bounds = ring.reduce(
      (acc, point) => acc.extend(point),
      new mapboxgl.LngLatBounds(ring[0], ring[0])
  );
  map.fitBounds(bounds, { padding: 60, duration: 800, maxZoom: 16 });
};

const tryApplyInitialBoundary = () => {
  if (initialApplied || !ready || !map || !pendingInitial) return;

  const ring = stripClosingPoint(pendingInitial);
  if (ring.length < 3) return;

  points = ring;
  closed = true;
  addMode = false;
  initialApplied = true;
  pendingInitial = null;

  refresh();
  applyCursor();
  fitToPoints(ring);
};

watch(
    () => props.initialBoundary,
    (boundary) => {
      if (initialApplied || !boundary || boundary.length < 3) return;
      pendingInitial = boundary;
      tryApplyInitialBoundary();
    },
    { immediate: true }
);

// ----- Place search (Mapbox geocoding) -----

const geocode = async (term) => {
  const query = (term ?? '').trim();
  if (query.length < 3 || !MAPBOX_TOKEN) {
    suggestions.value = [];
    return;
  }

  try {
    const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
        `?limit=5&access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    suggestions.value = (data.features ?? []).map((feature) => ({
      label: feature.place_name,
      center: [feature.center[0], feature.center[1]]
    }));
  } catch {
    suggestions.value = [];
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => geocode(searchTerm.value), 300);
};

const selectPlace = (place) => {
  searchTerm.value = place.label;
  suggestions.value = [];
  map?.flyTo({ center: place.center, zoom: 15, duration: 1500 });
};

const reverseGeocode = async (center) => {
  if (!MAPBOX_TOKEN) return;
  try {
    const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${center[0]},${center[1]}.json` +
        `?types=place,locality,region,country&limit=1&access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    locationLabel.value = data.features?.[0]?.place_name ?? '';
  } catch {
    locationLabel.value = '';
  }
};

const emitCenter = () => {
  if (!map) return;
  const center = map.getCenter();
  clearTimeout(centerTimer);
  centerTimer = setTimeout(() => reverseGeocode([center.lng, center.lat]), 700);
};

onMounted(() => {
  if (!mapContainer.value) return;

  mapboxService
      .createMapInstance({
        container: mapContainer.value,
        center: DEFAULT_CENTER,
        zoom: 13,
        style: 'mapbox://styles/mapbox/satellite-streets-v12'
      })
      .then((mapInstance) => {
        map = mapInstance;
        mapboxgl = window.mapboxgl;

        const onReady = () => {
          setupLayers();
          ready = true;
          applyCursor();
          emitCenter();
          tryApplyInitialBoundary();
          [200, 600, 1200].forEach((delay) => setTimeout(() => mapInstance.resize(), delay));
        };

        if (mapInstance.loaded()) {
          onReady();
        } else {
          mapInstance.once('load', onReady);
        }

        mapInstance.on('error', (event) => {
          console.error('[PlotBoundaryMap] Mapbox error.', event.error ?? event);
        });

        mapInstance.on('moveend', emitCenter);

        mapInstance.on('click', (event) => {
          if (closed || !addMode) return;
          points = [...points, [event.lngLat.lng, event.lngLat.lat]];
          refresh();
        });
      })
      .catch((error) => {
        console.error('[PlotBoundaryMap] Failed to initialize Mapbox.', error);
      });
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  clearTimeout(centerTimer);
  clearMarkers();
  map?.remove();
  map = null;
});
</script>

<template>
  <div class="boundary-wrap">
    <div class="boundary-search">
      <i class="pi pi-search search-icon"></i>
      <input
          v-model="searchTerm"
          type="text"
          class="search-input"
          :placeholder="t('plotCreate.boundary.searchPlace')"
          autocomplete="off"
          :disabled="!hasToken"
          @input="onSearchInput"
      />
      <ul v-if="suggestions.length" class="search-suggestions">
        <li
            v-for="place in suggestions"
            :key="place.label"
            class="search-suggestion"
            @click="selectPlace(place)"
        >
          {{ place.label }}
        </li>
      </ul>
    </div>

    <div class="boundary-map-area">
      <div ref="mapContainer" class="boundary-map"></div>
      <span class="map-status" :class="{ 'is-open': !closedState }">
        <span class="status-dot"></span>
        {{ closedState ? t('plotCreate.boundary.polygonClosed') : t('plotCreate.boundary.polygonOpen') }}
      </span>
      <div v-if="!hasToken" class="map-token-warning">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ t('plotCreate.boundary.tokenMissing') }}</span>
      </div>
    </div>

    <p v-if="locationLabel" class="map-location">
      <i class="pi pi-map-marker"></i>
      <span>{{ locationLabel }}</span>
    </p>
  </div>
</template>

<style scoped>
.boundary-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.boundary-search {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: #8c877f;
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 14px 0 38px;
  border: 1px solid #e0dbd2;
  border-radius: 10px;
  background: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 13px;
  color: #4f4f4f;
  outline: none;
}

.search-input::placeholder {
  color: #828282;
}

.search-input:focus {
  border-color: #2e4a3a;
}

.search-suggestions {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: #ffffff;
  border: 1px solid #e0dbd2;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(31, 37, 35, 0.12);
  max-height: 220px;
  overflow-y: auto;
}

.search-suggestion {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #333333;
  cursor: pointer;
}

.search-suggestion:hover {
  background: #f3f6f2;
  color: #2e4a3a;
}

.boundary-map-area {
  position: relative;
  width: 100%;
  height: 320px;
}

.boundary-map {
  width: 100%;
  height: 100%;
  min-height: 320px;
  border-radius: 14px;
  overflow: hidden;
  background: #d4e3c4;
}

.map-status {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #2e4a3a;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2e4a3a;
}

.map-status.is-open {
  color: #ff5c5c;
}

.map-status.is-open .status-dot {
  background: #ff5c5c;
}

.map-token-warning {
  position: absolute;
  z-index: 5;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(31, 37, 35, 0.82);
  color: #ffffff;
  font-size: 11px;
}

.map-location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 0;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #4f4f4f;
}

.map-location i {
  font-size: 14px;
  color: #2e4a3a;
}
</style>
