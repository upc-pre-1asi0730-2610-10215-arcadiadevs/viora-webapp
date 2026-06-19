<script setup>
/**
 * PlotThumbnail component.
 * Lightweight SVG thumbnail that renders a plot's boundary polygon, matching the
 * stylized green preview used on the My Plots cards. Avoids spinning up a full
 * Mapbox instance per card; falls back to a default shape when no coordinates
 * are available.
 *
 * @component
 */
import { computed } from 'vue';

const VIEWBOX = 100;
const PADDING = 20;
const DEFAULT_POINTS = '34,22 70,30 78,64 50,82 24,58';

const props = defineProps({
  /**
   * Plot boundary as GeoJSON-ordered [longitude, latitude] pairs.
   */
  polygonCoordinates: {
    type: Array,
    default: () => []
  }
});

/**
 * Polygon point list ("x,y x,y ...") normalized into the SVG viewBox.
 * @type {import('vue').ComputedRef<string>}
 */
const points = computed(() => {
  const coordinates = props.polygonCoordinates ?? [];

  if (coordinates.length < 3) {
    return DEFAULT_POINTS;
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);

  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);

  const longitudeSpan = maxLongitude - minLongitude || 1;
  const latitudeSpan = maxLatitude - minLatitude || 1;

  const usableSize = VIEWBOX - PADDING * 2;

  return coordinates
      .map(([longitude, latitude]) => {
        const x = PADDING + ((longitude - minLongitude) / longitudeSpan) * usableSize;
        // Flip the latitude axis because SVG y grows downward.
        const y = PADDING + ((maxLatitude - latitude) / latitudeSpan) * usableSize;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
});
</script>

<template>
  <svg
      class="plot-thumbnail"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
  >
    <polygon class="plot-shape" :points="points" />
    <circle class="plot-marker" cx="50" cy="50" r="4.5" />
  </svg>
</template>

<style scoped>
.plot-thumbnail {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: #d4e3c4;
}

.plot-shape {
  fill: #a7c994;
  stroke: #8fbb78;
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.plot-marker {
  fill: #3e6b4c;
}
</style>
