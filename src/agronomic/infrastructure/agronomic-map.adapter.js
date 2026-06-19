import { MapboxBaseAdapter } from "../../shared/infrastructure/mapbox-base.adapter.js";

/**
 * AgronomicMapAdapter.
 * Specialized infrastructure that bridges the Plot entity with Mapbox technical layers.
 */
export class AgronomicMapAdapter extends MapboxBaseAdapter {
    /**
     * Renders a plot with boundaries and NDVI heatmap overlay.
     * @param {import('../../domain/model/plot.entity.js').Plot} plot
     * @param {{ renderImageryTiles?: boolean }} options
     */
    renderPlotSurveillance(plot, options = {}) {
        if (!plot || !plot.polygonCoordinates) return;

        this.fitToCoordinates(plot.polygonCoordinates);

        if (options.renderImageryTiles && plot.currentImagery?.tileUrl) {
            this.addRasterLayer(
                'ndvi-imagery',
                plot.currentImagery.tileUrl,
                0.55
            );
        }

        this.addVigorFill('plot-vigor', plot.polygonCoordinates, plot.currentImagery?.ndviMean);
        this.addPolygon('plot-boundary', plot.polygonCoordinates, '#FFFFFF');
    }

    /**
     * Adds a translucent vigor fill so the plot remains legible even while
     * remote NDVI tiles are loading or unavailable.
     * @param {string} id
     * @param {Array<Array<number>>} coordinates
     * @param {number|null} ndviMean
     * @returns {void}
     */
    addVigorFill(id, coordinates, ndviMean = null) {
        this.removeSourceAndLayers(id);

        const fillColor = Number(ndviMean) >= 0.58
            ? '#20a957'
            : Number(ndviMean) >= 0.5
                ? '#7fc96a'
                : '#cf8a32';

        this.map.addSource(id, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coordinates] }
            }
        });

        this.map.addLayer({
            id: `${id}-layer`,
            type: 'fill',
            source: id,
            paint: {
                'fill-color': fillColor,
                'fill-opacity': 0.48
            }
        });
    }
}
