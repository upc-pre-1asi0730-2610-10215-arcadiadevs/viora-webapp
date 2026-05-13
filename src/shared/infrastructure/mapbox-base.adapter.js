/**
 * Technical infrastructure adapter for Mapbox.
 * Provides a simplified interface for common Mapbox GL JS operations
 * such as layer management and camera manipulation.
 *
 * @class MapboxBaseAdapter
 */
export class MapboxBaseAdapter {
    /**
     * Creates an instance of MapboxBaseAdapter.
     * @param {Object} mapInstance - The Mapbox GL JS map instance.
     */
    constructor(mapInstance) {
        /**
         * The internal Mapbox map instance.
         * @type {Object}
         * @private
         */
        this.map = mapInstance;
    }

    /**
     * Centers the camera to encompass a set of coordinates.
     *
     * @param {Array<Array<number>>} coordinates - An array of [longitude, latitude] pairs.
     * @returns {void}
     */
    fitToCoordinates(coordinates) {
        if (!coordinates || coordinates.length === 0) return;

        const bounds = new window.mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
        coordinates.forEach(coord => bounds.extend(coord));

        this.map.fitBounds(bounds, { padding: 50, duration: 1500 });
    }

    /**
     * Adds a polygon feature to the map.
     *
     * @param {string} id - Unique identifier for the source and layer.
     * @param {Array<Array<number>>} coordinates - Array of [longitude, latitude] vertices.
     * @param {string} [color='#FFFFFF'] - Hex color code for the polygon border.
     * @returns {void}
     */
    addPolygon(id, coordinates, color = '#FFFFFF') {
        this.removeSourceAndLayers(id);
        this.map.addSource(id, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coordinates] }
            }
        });
        this.map.addLayer({
            id: `${id}-layer`,
            type: 'line',
            source: id,
            paint: { 'line-color': color, 'line-width': 2 }
        });
    }

    /**
     * Adds a raster tile layer to the map.
     *
     * @param {string} id - Unique identifier for the source and layer.
     * @param {string} tileUrl - URL template for the raster tiles.
     * @param {number} [opacity=0.8] - Opacity level (0 to 1).
     * @returns {void}
     */
    addRasterLayer(id, tileUrl, opacity = 0.8) {
        this.removeSourceAndLayers(id);
        this.map.addSource(id, {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256
        });
        this.map.addLayer({
            id: `${id}-layer`,
            type: 'raster',
            source: id,
            paint: { 'raster-opacity': opacity }
        });
    }

    /**
     * Removes both the source and its associated layer from the map state.
     *
     * @param {string} id - Unique identifier used when the source was created.
     * @returns {void}
     */
    removeSourceAndLayers(id) {
        if (this.map.getLayer(`${id}-layer`)) this.map.removeLayer(`${id}-layer`);
        if (this.map.getSource(id)) this.map.removeSource(id);
    }
}