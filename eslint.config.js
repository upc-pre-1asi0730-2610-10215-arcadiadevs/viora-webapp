import importPlugin from 'eslint-plugin-import';
import vueParser from 'vue-eslint-parser';

/**
 * Bounded contexts under src/ that own real domain logic. `shared` is the
 * kernel — everyone may import shared/**, so it is deliberately excluded
 * from the "from" side of the boundary zones below (but every context,
 * shared included, is still checked as a "target": nobody may reach into
 * a sibling context's private domain/infrastructure).
 *
 * See docs/architecture-decisions/cross-context-composition.md (Rule A):
 * a bounded context's own application/*.store.js is the only sanctioned
 * cross-context entry point. Its domain/ and infrastructure/ are private.
 */
const DOMAIN_CONTEXTS = [
  'agronomic',
  'billing',
  'iam',
  'intervention',
  'profile',
  'support',
  'surveillance',
];
const ALL_CONTEXTS = [...DOMAIN_CONTEXTS, 'shared'];

const boundaryZones = ALL_CONTEXTS.flatMap((target) =>
  DOMAIN_CONTEXTS.filter((from) => from !== target).map((from) => ({
    target: `./src/${target}/**`,
    from: `./src/${from}/{domain,infrastructure}/**`,
  })),
);

export default [
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-restricted-paths': ['error', { zones: boundaryZones }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'server/**'],
  },
];
