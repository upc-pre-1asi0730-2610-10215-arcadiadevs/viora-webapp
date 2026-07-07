import useSubscriptionAccessStore from '../application/subscription-access.store.js';

/**
 * Redirects signed-in users without an active subscription to /plans.
 * Only applies to routes inside the guarded workspace (meta.public !== true).
 */
export const subscriptionGuard = async (to) => {
  if (to.meta.public === true) return true;

  const access = useSubscriptionAccessStore();
  const hasAccess = await access.check();

  return hasAccess ? true : { name: 'billing-plans' };
};
