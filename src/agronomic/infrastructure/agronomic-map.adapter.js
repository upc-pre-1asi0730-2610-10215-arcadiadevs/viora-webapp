import { MapboxBaseAdapter } from "../../shared/infrastructure/mapbox-base.adapter.js";
import { Plot } from "../domain/model/plot.entity.js";

/**
 * AgronomicMapAdapter.
 * Specialized infrastructure that bridges the Plot entity with Mapbox technical layers.
 */
export class AgronomicMapAdapter extends MapboxBaseAdapter {
    /**
     * Renders a plot with boundaries and NDVI heatmap overlay.
     * @param {import('../../domain/model/plot.entity.js').Plot} plot
     */
    renderPlotSurveillance(plot) {
        if (!plot || !plot.polygonCoordinates) return;

        this.fitToCoordinates(plot.polygonCoordinates);
        this.addPolygon('plot-boundary', plot.polygonCoordinates, '#FFFFFF');

        if (plot.currentImagery?.tileUrl) {
            this.addRasterLayer(
                'ndvi-imagery',
                plot.currentImagery.tileUrl,
                0.8,
                'plot-boundary-layer'
            );
        }
    }
}