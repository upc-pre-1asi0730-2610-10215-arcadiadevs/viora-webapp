<script setup>
/**
 * App component.
 * Root component of the application serving as the main entry point and shell.
 *
 * @component
 */
import Layout from './shared/presentation/components/layout.vue';
</script>

<template>
  <Layout />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

body {
  margin: 0;
  padding: 0;
  background-color: #F8F4ED;
  -webkit-font-smoothing: antialiased;
}

.font-poppins {
  font-family: 'Poppins', sans-serif;
}
</style>