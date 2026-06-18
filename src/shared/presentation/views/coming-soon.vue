<script setup>
/**
 * ComingSoon view.
 * Global placeholder surface for producer workspaces that are not yet built.
 * It is wired through the router so any not-yet-developed sidebar destination
 * lands here, reading its labels from the route meta.
 *
 * @component
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

const sectionLabel = computed(() => {
  const label = route.meta?.sectionLabel;
  return label ? t(label) : t('comingSoon.section');
});

const subtitle = computed(() => {
  const subtitleKey = route.meta?.subtitle;
  return subtitleKey ? t(subtitleKey) : t('comingSoon.subtitle');
});
</script>

<template>
  <div class="coming-soon-view">
    <header class="coming-soon-header">
      <h1 class="page-title">{{ sectionLabel }}</h1>
      <p class="page-subtitle">{{ subtitle }}</p>
    </header>

    <section class="coming-soon-card">
      <div class="status-icon" :style="{ '--icon-url': `url('/assets/icons/dashboard/construct-outline.svg')` }"></div>

      <div class="message">
        <span class="section-tag">{{ sectionLabel }}</span>
        <h2>{{ t('comingSoon.title') }}</h2>
        <p>{{ t('comingSoon.message') }}</p>
      </div>

      <router-link to="/dashboard" class="back-button">
        <i class="pi pi-arrow-left"></i>
        {{ t('comingSoon.backToDashboard') }}
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.coming-soon-view {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 16px;
  font-family: 'Poppins', sans-serif;
  color: #1f2523;
}

.coming-soon-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  color: #1f2523;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #6f7d73;
}

.coming-soon-card {
  min-height: 420px;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 22px;
  padding: 56px;
  border: 1px solid #edf0ec;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.status-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #f8f4ed;
  position: relative;
}

.status-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 34px;
  height: 34px;
  background: #2e4a3a;
  mask: var(--icon-url) center / contain no-repeat;
  -webkit-mask: var(--icon-url) center / contain no-repeat;
}

.message {
  max-width: 560px;
}

.section-tag {
  display: block;
  margin-bottom: 8px;
  color: #6f7d73;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
}

.message h2 {
  margin: 0;
  color: #1f2523;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.15;
}

.message p {
  margin: 12px 0 0;
  color: #5e6962;
  font-size: 15px;
  line-height: 1.6;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  border: 1px solid #2e4a3a;
  border-radius: 8px;
  color: #2e4a3a;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #2e4a3a;
  color: #ffffff;
}

@media (max-width: 700px) {
  .coming-soon-card {
    min-height: 360px;
    padding: 32px 24px;
  }

  .message h2 {
    font-size: 28px;
  }
}
</style>
