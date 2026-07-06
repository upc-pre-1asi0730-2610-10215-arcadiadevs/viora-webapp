<script setup>
/**
 * Role-aware entry point for the shared `/dashboard` path.
 * Producer and specialist accounts land on the same route; this view picks
 * which dashboard to render so each segment keeps its own component instead
 * of branching inside the router config. Mirrors the intent of os-viora's
 * `specialistDashboardMatch` route matcher, ported to Vue's composition idioms.
 */
import useIamStore from '../../../iam/application/iam.store.js';
import DashboardProducer from './dashboard-producer.vue';
import ComingSoon from './coming-soon.vue';

const iamStore = useIamStore();
</script>

<template>
  <DashboardProducer v-if="!iamStore.isSpecialist" />
  <ComingSoon v-else />
</template>
