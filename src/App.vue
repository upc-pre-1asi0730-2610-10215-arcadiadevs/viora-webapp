<script setup>
/**
 * App component.
 * Root component of the application serving as the main entry point and shell.
 *
 * @component
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Layout from './shared/presentation/components/layout.vue';

const route = useRoute();
const isPublicRoute = computed(() => route.meta.public === true);
</script>

<template>
  <router-view v-if="isPublicRoute" />
  <Layout v-else />
</template>
