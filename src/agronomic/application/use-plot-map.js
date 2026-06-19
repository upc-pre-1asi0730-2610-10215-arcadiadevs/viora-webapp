import { shallowRef, onUnmounted } from 'vue';
import { mapboxService } from '../../shared/infrastructure/mapbox.service.js';
import { AgronomicMapAdapter } from '../infrastructure/agronomic-map.adapter.js';

/**
 * usePlotMap.js
 * * Role: Plot Map Application Service (implemented as a Vue Composable).
 * This service orchestrates the interaction between the UI and Map Infrastructure.
 * It encapsulates the map's lifecycle and ensures clean architectural separation.
 */
export function usePlotMap(containerRef, options = {}) {
    /** @type {import('vue').Ref<Object|null>} */
    const map = shallowRef(null);
    /** @type {AgronomicMapAdapter|null} */
    let adapter = null;
    const renderImageryTiles = options.renderImageryTiles === true;

    /**
     * Initializes the Mapbox infrastructure using the shared service.
     * @param {import('../domain/model/plot.entity.js').Plot|null} initialPlot - Optional plot to render on load.
     */
    const init = (initialPlot = null) => {
        if (!containerRef.value) return;
        mapboxService.createMapInstance({
            container: containerRef.value,
            zoom: 14,
            center: initialPlot ? initialPlot.polygonCoordinates[0] : [0, 0]
        })
            .then((mapInstance) => {
                mapInstance.on('load', () => {
                    adapter = new AgronomicMapAdapter(mapInstance);

                    if (initialPlot) {
                        render(initialPlot);
                    }

                    setTimeout(() => {
                        if (mapInstance) {
                            mapInstance.resize();
                        }
                    }, 500);

                    setTimeout(() => {
                        if (mapInstance) {
                            mapInstance.resize();
                        }
                    }, 2000);
                });

                map.value = mapInstance;
            })
            .catch((error) => {
                console.error("[Application Service] Failed to initialize plot map logic:", error);
                options.onError?.(error);
            });
    };

    /**
     * Commands the infrastructure adapter to render a plot's boundaries and NDVI.
     * @param {import('../domain/model/plot.entity.js').Plot} plot - The domain entity to visualize.
     */
    const render = (plot) => {
        if (adapter && plot) {
            adapter.renderPlotSurveillance(plot, { renderImageryTiles });
        }
    };

    /**
     * Destroys the map instance and clears references to prevent memory leaks.
     */
    const cleanup = () => {
        if (map.value) {
            map.value.remove();
            map.value = null;
            adapter = null;
        }
    };

    // Automatically manage lifecycle if the component is unmounted
    onUnmounted(() => {
        cleanup();
    });

    return {
        init,
        render,
        cleanup
    };
}
