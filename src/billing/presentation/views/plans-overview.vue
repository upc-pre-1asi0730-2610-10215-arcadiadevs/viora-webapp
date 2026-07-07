<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useIamStore from '../../../iam/application/iam.store.js';
import { useSubscriptionStore } from '../../application/subscription.store.js';

const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();
const subscriptionStore = useSubscriptionStore();

const loading = ref(true);
const segment = ref('grower');
const redirecting = ref(false);
let referralCode = null;

const isSpecialist = computed(() => segment.value === 'specialist');
const isSignedIn = computed(() => iamStore.isSignedIn);
const checkoutError = computed(() => subscriptionStore.error);

/** The two plans for the active segment, monthly first, annual ("Pro") last. */
const segmentPlans = computed(() => {
  const prefix = isSpecialist.value ? 'specialist-' : 'grower-';
  return subscriptionStore.plans
    .filter((plan) => plan.code.startsWith(prefix))
    .sort((a, b) => (a.isAnnual === b.isAnnual ? 0 : a.isAnnual ? 1 : -1));
});

const characterSrc = computed(() =>
  isSpecialist.value
    ? '/assets/images/general/phytosanitary-specialist-character-2.png'
    : '/assets/images/general/olive-producer-character-2.png'
);

onMounted(async () => {
  const role = route.query.role;
  if (role === 'ROLE_SPECIALIST' || role === 'specialist') segment.value = 'specialist';
  referralCode = route.query.ref ?? null;

  await subscriptionStore.loadPlans();
  loading.value = false;
});

function selectSegment(value) {
  segment.value = value;
}

/**
 * A fresh visitor goes to registration first; a visitor who already has an
 * account (a session is present) skips straight to checkout — this also frees
 * an account that signed up but never paid from being pinned to this screen.
 */
function choose(plan) {
  if (isSignedIn.value) {
    redirecting.value = true;
    subscriptionStore.startCheckout(plan.code, plan.interval, () => { redirecting.value = false; });
    return;
  }

  router.push({
    path: '/register',
    query: {
      role: isSpecialist.value ? 'ROLE_SPECIALIST' : 'ROLE_GROWER',
      plan: plan.code,
      interval: plan.interval,
      ...(referralCode ? { ref: referralCode } : {})
    }
  });
}

function logout() {
  iamStore.signOut();
  router.push('/login');
}
</script>

<template>
  <div class="plans-page" :class="{ 'is-specialist': isSpecialist }">
    <header class="plans-top">
      <div class="plans-brand">
        <img src="/assets/icons/dashboard/viora-isotipo-green.png" alt="" />
        <strong>Viora</strong>
      </div>
      <div class="plans-top-actions">
        <template v-if="isSignedIn">
          <span class="have">Signed in</span>
          <button type="button" class="login-link" @click="logout">Switch account</button>
        </template>
        <template v-else>
          <span class="have">Have an account?</span>
          <router-link class="login-link" to="/login">Sign in</router-link>
        </template>
      </div>
    </header>

    <main class="plans-content">
      <section class="plans-intro">
        <span class="plans-eyebrow">Choose your plan</span>
        <h1>Pick the plan that fits how you use Viora</h1>
        <p class="plans-lede">Every plan includes a 30-day satisfaction window and can be canceled anytime.</p>

        <div class="segment-switch" role="tablist" aria-label="Account type">
          <button
            type="button"
            role="tab"
            :aria-selected="!isSpecialist"
            :class="{ active: !isSpecialist }"
            @click="selectSegment('grower')"
          >
            <i class="pi pi-sun"></i> Producer
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="isSpecialist"
            :class="{ active: isSpecialist }"
            @click="selectSegment('specialist')"
          >
            <i class="pi pi-shield"></i> Specialist
          </button>
        </div>
      </section>

      <section class="plans-showcase">
        <aside class="plans-character" aria-hidden="true">
          <img :src="characterSrc" alt="" />
        </aside>

        <div class="plans-cards">
          <div v-if="loading" class="plans-loading">
            <i class="pi pi-spin pi-spinner"></i> Loading plans…
          </div>
          <div v-else-if="segmentPlans.length === 0" class="plans-loading">
            <i class="pi pi-exclamation-triangle"></i> No plans available right now.
          </div>
          <article
            v-for="plan in segmentPlans"
            :key="plan.code"
            class="plan-card"
            :class="{ featured: plan.isAnnual }"
          >
            <span v-if="plan.isAnnual" class="ribbon"><i class="pi pi-star-fill"></i> Best value</span>
            <header class="plan-head">
              <h2>{{ plan.name }}</h2>
              <p class="tagline">{{ plan.tagline }}</p>
            </header>

            <div class="price">
              <span class="amount">{{ plan.priceLabel }}</span>
              <span class="suffix">{{ plan.intervalSuffix }}</span>
            </div>

            <button type="button" class="cta" :disabled="redirecting" @click="choose(plan)">
              {{ redirecting ? 'Redirecting…' : `Choose ${plan.name}` }}
              <i v-if="!redirecting" class="pi pi-arrow-right"></i>
            </button>

            <ul class="features">
              <li v-for="feature in plan.features" :key="feature"><i class="pi pi-check"></i> <span>{{ feature }}</span></li>
            </ul>
          </article>
        </div>
      </section>

      <p v-if="checkoutError" class="checkout-error"><i class="pi pi-exclamation-triangle"></i> {{ checkoutError }}</p>

      <footer class="plans-foot">
        <span><i class="pi pi-lock"></i> Payments secured by MercadoPago</span>
        <span class="dot">·</span>
        <span>Cancel anytime</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.plans-page {
  min-height: 100vh;
  background: #f8f4ed;
  font-family: 'Poppins', sans-serif;
  color: #1f2523;
}

.plans-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
}

.plans-brand { display: flex; align-items: center; gap: 10px; }
.plans-brand img { width: 30px; height: 30px; }
.plans-brand strong { font-size: 18px; font-weight: 600; }

.plans-top-actions { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.have { color: #6f6a62; }
.login-link {
  border: none;
  background: none;
  padding: 0;
  color: #2e4a3a;
  font-weight: 600;
  font-family: inherit;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
}
.login-link:hover { text-decoration: underline; }

.plans-content {
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 32px 56px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.plans-intro { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.plans-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2e7d55;
}
.plans-intro h1 { margin: 0; font-size: 30px; font-weight: 600; max-width: 560px; }
.plans-lede { margin: 0; color: #6f6a62; font-size: 14px; max-width: 460px; }

.segment-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e2ddd4;
  margin-top: 8px;
}
.segment-switch button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #6f6a62;
  cursor: pointer;
}
.segment-switch button.active { background: #2e4a3a; color: #fff; }

.plans-showcase {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
  gap: 32px;
  align-items: center;
}

.plans-character { display: flex; justify-content: center; }
.plans-character img { width: 100%; max-width: 200px; height: auto; filter: drop-shadow(0 12px 26px rgba(0, 0, 0, 0.14)); }

.plans-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.plans-loading {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #6f6a62;
  font-size: 14px;
}

.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 26px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e2ddd4;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.06);
}
.plan-card.featured { border-color: #2e4a3a; box-shadow: 0 16px 36px rgba(46, 74, 58, 0.16); }

.ribbon {
  position: absolute;
  top: -12px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  background: #2e4a3a;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.plan-head h2 { margin: 0; font-size: 18px; font-weight: 600; }
.tagline { margin: 4px 0 0; font-size: 13px; color: #6f6a62; }

.price { display: flex; align-items: baseline; gap: 6px; }
.amount { font-size: 28px; font-weight: 700; }
.suffix { font-size: 13px; color: #828282; }

.cta {
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #2e4a3a;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.cta:disabled { opacity: 0.6; cursor: not-allowed; }

.features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.features li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4f4f4f; }
.features li i { color: #2e7d55; }

.checkout-error {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 92, 92, 0.1);
  color: #d63b3b;
  font-size: 13px;
}

.plans-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #a7a29a;
  font-size: 12px;
}
.plans-foot i { margin-right: 4px; }

@media (max-width: 860px) {
  .plans-showcase { grid-template-columns: 1fr; }
  .plans-character { display: none; }
  .plans-cards { grid-template-columns: 1fr; }
}
</style>
