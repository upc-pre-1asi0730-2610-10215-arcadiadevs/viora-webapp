/**
 * Fixed catalogue of specialist service tags.
 *
 * The persisted `value` is matched verbatim by backend recommendation rules;
 * translate only `labelKey` at the presentation edge.
 */
export const SPECIALIST_SERVICE_TAGS = [
    { value: 'Xylella monitoring', labelKey: 'settingsPage.profile.tags.xylella' },
    { value: 'Phytosanitary inspection', labelKey: 'settingsPage.profile.tags.phytosanitary' },
    { value: 'Biological control', labelKey: 'settingsPage.profile.tags.biological' },
    { value: 'Pest & leaf symptoms', labelKey: 'settingsPage.profile.tags.pest' },
    { value: 'Pest treatment', labelKey: 'settingsPage.profile.tags.treatment' },
    { value: 'Field inspection', labelKey: 'settingsPage.profile.tags.inspection' },
    { value: 'Low-vigor / NDVI diagnosis', labelKey: 'settingsPage.profile.tags.ndvi' },
    { value: 'Water stress & irrigation', labelKey: 'settingsPage.profile.tags.water' },
    { value: 'Climate & phenological risk', labelKey: 'settingsPage.profile.tags.climate' },
    { value: 'Chill deficit', labelKey: 'settingsPage.profile.tags.chill' },
    { value: 'Nutritional deficiency', labelKey: 'settingsPage.profile.tags.nutritional' },
];

/** Splits a stored comma-separated tag string into trimmed, non-empty values. */
export function parseServiceTags(raw) {
    return (raw ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
}
