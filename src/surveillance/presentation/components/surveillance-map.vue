<script setup>
/**
 * SurveillanceMap component.
 * Mapbox satellite map of a single plot with boundary polygon and risk markers.
 *
 * @component
 * @prop {number[][]} boundary - Array of [lng, lat] forming the plot polygon
 * @prop {Object[]} markers - Array of { lngLat: [lng, lat], riskZone: string, label: string }
 */
import { onMounted, onUnmounted, ref } from 'vue';
import { mapboxService } from '../../../shared/infrastructure/mapbox.service.js';

const props = defineProps({
    boundary: { type: Array, default: () => [] },
    markers: { type: Array, default: () => [] }
});

const mapContainer = ref(null);
let mapInstance = null;

const ZONE_COLORS = {
    FULL_PLOT: '#E53535',
    PARTIAL_PLOT: '#C15A2E',
    EDGES: '#9CA3AF'
};

function computeCenter(boundary) {
    if (!boundary || boundary.length === 0) return [-70.04, -18.01];
    const sumLng = boundary.reduce((s, c) => s + c[0], 0);
    const sumLat = boundary.reduce((s, c) => s + c[1], 0);
    return [sumLng / boundary.length, sumLat / boundary.length];
}

onMounted(async () => {
    if (!mapContainer.value) return;
    try {
        const center = computeCenter(props.boundary);
        mapInstance = await mapboxService.createMapInstance({
            container: mapContainer.value,
            center,
            zoom: 13
        });

        const mapboxgl = window.mapboxgl;

        mapInstance.on('load', () => {
            // Draw plot boundary polygon
            if (props.boundary.length >= 3) {
                const coords = [...props.boundary, props.boundary[0]];
                mapInstance.addSource('plot-boundary', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'Polygon', coordinates: [coords] }
                    }
                });
                mapInstance.addLayer({
                    id: 'plot-boundary-fill',
                    type: 'fill',
                    source: 'plot-boundary',
                    paint: { 'fill-color': '#2E4A3A', 'fill-opacity': 0.08 }
                });
                mapInstance.addLayer({
                    id: 'plot-boundary-outline',
                    type: 'line',
                    source: 'plot-boundary',
                    paint: { 'line-color': '#2E4A3A', 'line-width': 2.5 }
                });
            }

            // Place risk markers
            props.markers.forEach(marker => {
                const color = ZONE_COLORS[marker.riskZone] || '#9CA3AF';
                new mapboxgl.Marker({ color })
                    .setLngLat(marker.lngLat)
                    .setPopup(new mapboxgl.Popup().setText(marker.label || marker.riskZone))
                    .addTo(mapInstance);
            });
        });
    } catch (err) {
        console.error('[SurveillanceMap] Error initializing map:', err);
    }
});

onUnmounted(() => {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
});
</script>

<template>
    <div ref="mapContainer" class="surveillance-map"></div>
</template>

<style scoped>
.surveillance-map {
    width: 100%;
    height: 100%;
    min-height: 300px;
    border-radius: 8px;
    overflow: hidden;
}
</style>
