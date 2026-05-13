<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <footer class="footer-container py-6 px-8 mt-auto">
    <div class="footer-content max-w-[1200px] mx-auto border-t border-gray-100 pt-6">
      <div class="grid grid-nogutter align-items-center justify-content-center text-center">
        <div class="col-12 mb-2">
          <p class="copyright-text">Copyright &copy; 2026. <span class="font-bold text-emerald-800">ArcadiaDevs</span></p>
        </div>
        <div class="col-12">
          <p class="authoring-text">
            {{ t('authoring-phrase.intro') }}
            <i class="pi pi-heart text-red-500 mx-1 pulse-heart"></i>
            {{ t('authoring-phrase.use') }}
            <a href="https://primevue.org/" target="_blank" class="primevue-link font-semibold">PrimeVue</a>
            {{ t('authoring-phrase.author', { brand: 'ArcadiaDevs' }) }}
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-container {
  background-color: transparent;
  font-family: 'Poppins', sans-serif;
}

.copyright-text {
  font-size: 14px;
  color: #4F4F4F;
  margin: 0;
}

.authoring-text {
  font-size: 13px;
  color: #8C877F;
  margin: 0;
}

.primevue-link {
  color: #10B981;
  text-decoration: none;
  transition: color 0.2s;
}

.primevue-link:hover {
  color: #059669;
  text-decoration: underline;
}

.pulse-heart {
  animation: pulse 1.5s ease-in-out infinite;
  display: inline-block;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
