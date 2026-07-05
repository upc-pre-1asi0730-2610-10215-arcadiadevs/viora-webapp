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
        <span v-else class="breadcrumb-text">
          {{ crumb.label }}
        </span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-sep">/</span>
      </template>
    </div>

    <div class="header-row">
      <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
      <div class="header-actions">
        <span v-if="updatedLabel" class="sync-label">{{ updatedLabel }}</span>
        <slot name="actions" />
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
  flex-wrap: wrap;
  gap: 6px;
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: #1f2523;
}

.breadcrumb-link {
  color: #1f2523;
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: #2e4a3a;
}

.breadcrumb-text {
  color: #1f2523;
}

.breadcrumb-sep {
  color: #1f2523;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-subtitle {
  margin: 8px 0 0;
  color: #6b716d;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.sync-label {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border: 1px solid #2e4a3a;
  border-radius: 999px;
  color: #2e4a3a;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
}

.refresh-btn {
  color: #2e4a3a;
}
</style>
