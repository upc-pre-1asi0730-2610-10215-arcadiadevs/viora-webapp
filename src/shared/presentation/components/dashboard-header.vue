<script setup>
defineProps({
  breadcrumbs: {
    type: Array,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  updatedLabel: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['refresh']);
</script>

<template>
  <header class="dashboard-header-bar">
    <div class="header-breadcrumbs">
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <router-link
          v-if="crumb.route"
          :to="crumb.route"
          class="breadcrumb-link"
        >
          {{ crumb.label }}
        </router-link>
        <span v-else :class="['breadcrumb-text', { 'is-disabled': crumb.disabled }]">
          {{ crumb.label }}
        </span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-sep">/</span>
      </template>
    </div>

    <div class="header-row">
      <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
      <div class="header-actions">
        <span v-if="updatedLabel" class="sync-label">{{ updatedLabel }}</span>
        <pv-button
          type="button"
          class="refresh-btn"
          icon="pi pi-refresh"
          @click="emit('refresh')"
          text
        />
      </div>
    </div>
  </header>
</template>

<style scoped>
.dashboard-header-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0 8px;
}

.header-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #8c877f;
}

.breadcrumb-link {
  color: #2e4a3a;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-text {
  color: #4f4f4f;
  font-weight: 500;
}

.breadcrumb-text.is-disabled {
  color: #8c877f;
  font-weight: 400;
}

.breadcrumb-sep {
  color: #ccc;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-subtitle {
  margin: 0;
  color: #6b6660;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.sync-label {
  color: #8c877f;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
}

.refresh-btn {
  color: #2e4a3a;
}
</style>
