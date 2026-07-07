/**
 * @file subscription-access.store.js
 * @description Gate for the payment-first model: tells the workspace guard
 * whether the signed-in user has an active subscription. The result is
 * cached so navigation stays instant; a completed checkout marks it active
 * optimistically and sign-out resets it.
 *
 * @module useSubscriptionAccessStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SubscriptionApi } from '../infrastructure/subscription-api.js';
import { SubscriptionAssembler } from '../infrastructure/subscription-response.js';

const subscriptionApi = new SubscriptionApi();

export const useSubscriptionAccessStore = defineStore('subscription-access', () => {
  /** @type {import('vue').Ref<'unknown'|'active'|'inactive'>} */
  const status = ref('unknown');

  const hasActiveAccess = computed(() => status.value === 'active');

  /**
   * Checks the current user's subscription status, caching an active result.
   * @returns {Promise<boolean>}
   */
  async function check() {
    if (status.value === 'active') return true;

    try {
      const response = await subscriptionApi.getSubscription();
      const subscription = SubscriptionAssembler.toEntity(response.data);
      const active = subscription?.status === 'ACTIVE';
      status.value = active ? 'active' : 'inactive';
      return active;
    } catch {
      status.value = 'inactive';
      return false;
    }
  }

  function markActive() {
    status.value = 'active';
  }

  function reset() {
    status.value = 'unknown';
  }

  return { hasActiveAccess, check, markActive, reset };
});

export default useSubscriptionAccessStore;
