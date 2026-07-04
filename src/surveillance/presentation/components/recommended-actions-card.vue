<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const actions = [
  { labelKey: 'recommended.nutrition', iconPath: '/assets/icons/dashboard/leaf-outline.svg', route: '/agronomic/dynamic-nutrition' },
  { labelKey: 'recommended.expert', iconPath: '/assets/icons/dashboard/people-outline.svg', route: '/assistance/expert-assistance' },
  { labelKey: 'recommended.inspect', iconPath: '/assets/icons/dashboard/information-circle-outline.svg', route: '/agronomic/plots' },
  { labelKey: 'recommended.symptoms', iconPath: '/assets/icons/dashboard/megaphone-outline.svg', route: '/surveillance/pest-surveillance' }
];
</script>

<template>
  <aside class="recommended-card">
    <h2>{{ t('recommended.title') }}</h2>
    <nav>
      <router-link v-for="action in actions" :key="action.labelKey" :to="action.route">
        <img :src="action.iconPath" alt="" />
        <span>{{ t(action.labelKey) }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.recommended-card {
  height: 100%;
  box-sizing: border-box;
  padding: 22px 0;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.recommended-card h2 {
  margin: 0 22px 22px;
  color: #1f2523;
  font-size: 18px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
  text-align: center;
}

.recommended-card nav {
  display: grid;
}

.recommended-card a {
  min-height: 66px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 22px;
  border-top: 1px solid #edf0ec;
  color: #4f4f4f;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
  transition: background-color 180ms ease, color 180ms ease;
}

.recommended-card a:hover {
  background: #f8f4ed;
  color: #2e4a3a;
}

.recommended-card img {
  width: 20px;
  height: 20px;
}
</style>
