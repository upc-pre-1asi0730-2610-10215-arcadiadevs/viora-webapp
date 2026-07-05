<script setup>
/**
 * CommunityRiskMap component.
 * Mapbox satellite map showing community risk with concentric radius rings.
 *
 * @component
 * @prop {number[]|null} center - [lng, lat] centroid
 * @prop {number} radiusKm - Radius in kilometers
 * @prop {Object[]} signals - Array of NearbyRiskSignal entities
 */
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { mapboxService } from '../../../shared/infrastructure/mapbox.service.js';

const props = defineProps({
    center: { type: Array, default: null },
    radiusKm: { type: Number, default: 5 },
    signals: { type: Array, default: () => [] }
});

const mapContainer = ref(null);
let mapInstance = null;

const SEVERITY_COLORS = {
    High: '#FF5C5C',
    Medium: '#C15A2E',
    Low: '#9CA3AF'
};

function toRadians(deg) { return deg * Math.PI / 180; }

function destinationPoint(lng, lat, distanceKm, bearingDeg) {
    const R = 6371;
    const d = distanceKm / R;
    const brng = toRadians(bearingDeg);
    const lat1 = toRadians(lat);
    const lng1 = toRadians(lng);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
    const lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));

    return [lng2 * 180 / Math.PI, lat2 * 180 / Math.PI];
}

function generateCirclePoints(center, radiusKm, numPoints = 64) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const bearing = (i / numPoints) * 360;
        points.push(destinationPoint(center[0], center[1], radiusKm, bearing));
    }
    return points;
}

function hasValidCenter(center) {
    return Array.isArray(center)
        && center.length >= 2
        && Number.isFinite(Number(center[0]))
        && Number.isFinite(Number(center[1]));
}

function signalBearing(signal, index) {
    const numericSeed = Number(signal.id);
    const seed = Number.isFinite(numericSeed) ? numericSeed : index + 1;
    return (seed * 137.508) % 360;
}

function renderMap(map) {
    if (!hasValidCenter(props.center)) return;

    const mapboxgl = window.mapboxgl;
    const [lng, lat] = props.center;

    new mapboxgl.Marker({ color: '#2E4A3A' })
        .setLngLat(props.center)
        .setPopup(new mapboxgl.Popup().setText('Center Plot'))
        .addTo(map);

    const rings = [
        { radius: props.radiusKm, opacity: 0.12 },
        { radius: props.radiusKm * 0.66, opacity: 0.18 },
        { radius: props.radiusKm * 0.33, opacity: 0.25 }
    ];

    rings.forEach((ring, i) => {
        const coords = generateCirclePoints(props.center, ring.radius);
        map.addSource('radius-' + i, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coords] }
            }
        });
        map.addLayer({
            id: 'radius-fill-' + i,
            type: 'fill',
            source: 'radius-' + i,
            paint: { 'fill-color': '#2E4A3A', 'fill-opacity': ring.opacity }
        });
        map.addLayer({
            id: 'radius-outline-' + i,
            type: 'line',
            source: 'radius-' + i,
            paint: { 'line-color': '#2E4A3A', 'line-width': 1.5, 'line-dasharray': [4, 2] }
        });
    });

    props.signals.forEach((signal, index) => {
        const bearing = signalBearing(signal, index);
        const fallbackDistance = props.radiusKm * (0.35 + ((index % 3) * 0.2));
        const dist = Math.min(Number(signal.distanceKm) || fallbackDistance, props.radiusKm);
        const pos = destinationPoint(lng, lat, dist, bearing);
        const color = SEVERITY_COLORS[signal.severity] || '#9CA3AF';

        new mapboxgl.Marker({ color })
            .setLngLat(pos)
            .setPopup(new mapboxgl.Popup().setText(signal.title + ' (' + signal.severity + ')'))
            .addTo(map);
    });
}

function renderWhenReady(map) {
    if (map.loaded()) {
        renderMap(map);
        return;
    }
    map.on('load', () => renderMap(map));
}

async function initializeMap() {
    if (!mapContainer.value) return;
    if (!hasValidCenter(props.center)) return;

    try {
        mapInstance = await mapboxService.createMapInstance({
            container: mapContainer.value,
            center: props.center,
            zoom: 10
        });
        renderWhenReady(mapInstance);
    } catch (err) {
        console.error('[CommunityRiskMap] Error initializing map:', err);
    }
}

onMounted(async () => {
    await initializeMap();
});

onUnmounted(() => {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
});

watch(() => [props.center, props.signals, props.radiusKm], async () => {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
    await initializeMap();
}, { deep: true });
</script>

<template>
    <div ref="mapContainer" class="community-risk-map"></div>
</template>

<style scoped>
.community-risk-map {
    width: 100%;
    height: 100%;
    min-height: 300px;
    border-radius: 8px;
    overflow: hidden;
}
</style>
