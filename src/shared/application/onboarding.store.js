import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Pinia store that tracks onboarding state per user, persisted to localStorage.
 * Role-agnostic: it only tracks which step IDs are done; the checklist and
 * coachmarks own the per-role step sets.
 *
 * @module useOnboardingStore
 */

/**
 * @typedef {'plot'|'dashboard'|'expert'|'profile'|'sp-dashboard'|'marketplace'} OnboardingStepId
 */

/**
 * @typedef {{ minimized: boolean, dismissed: boolean, completed: Record<string, boolean> }} OnboardingState
 */

const DEFAULT_STATE = /** @type {OnboardingState} */ ({
  minimized: false,
  dismissed: false,
  completed: {},
});

export const useOnboardingStore = defineStore('onboarding', () => {
  const iamStore = useIamStore();

  const minimized = ref(DEFAULT_STATE.minimized);
  const dismissed = ref(DEFAULT_STATE.dismissed);
  /** @type {import('vue').Ref<Record<string, boolean>>} */
  const completed = ref({ ...DEFAULT_STATE.completed });

  // --- Computed ---

  const completedCount = computed(() =>
    Object.values(completed.value).filter(Boolean).length,
  );

  // --- Private helpers ---

  function storageKey() {
    const userId = iamStore.currentUserId ?? 'anonymous';
    return `viora.onboarding.${userId}`;
  }

  function restore() {
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return;
      const parsed = JSON.parse(raw);
      minimized.value = parsed.minimized ?? DEFAULT_STATE.minimized;
      dismissed.value = parsed.dismissed ?? DEFAULT_STATE.dismissed;
      completed.value = { ...(parsed.completed ?? {}) };
    } catch {
      // Corrupted storage — start fresh.
    }
  }

  function persist() {
    try {
      localStorage.setItem(
        storageKey(),
        JSON.stringify({
          minimized: minimized.value,
          dismissed: dismissed.value,
          completed: completed.value,
        }),
      );
    } catch {
      // Private browsing or storage limits should not break onboarding.
    }
  }

  // Restore on init.
  restore();

  // Watch for user changes and reset state to avoid cross-user data leaks.
  // When currentUserId changes (login, logout, or user switch), reset the in-memory state
  // and restore from the new user's localStorage.
  watch(
    () => iamStore.currentUserId,
    () => {
      // Reset to default state first to avoid mixing data
      minimized.value = DEFAULT_STATE.minimized;
      dismissed.value = DEFAULT_STATE.dismissed;
      completed.value = { ...DEFAULT_STATE.completed };
      // Then restore the new user's onboarding state
      restore();
    }
  );

  // --- Public actions ---

  /**
   * @param {OnboardingStepId} stepId
   * @returns {boolean}
   */
  function isCompleted(stepId) {
    return completed.value[stepId] ?? false;
  }

  /**
   * @param {OnboardingStepId} stepId
   */
  function complete(stepId) {
    if (completed.value[stepId]) return;
    completed.value = { ...completed.value, [stepId]: true };
    persist();
  }

  /** @param {boolean} value */
  function setMinimized(value) {
    minimized.value = value;
    dismissed.value = false;
    persist();
  }

  function dismiss() {
    dismissed.value = true;
    minimized.value = true;
    persist();
  }

  function reopen() {
    dismissed.value = false;
    minimized.value = false;
    persist();
  }

  return {
    minimized,
    dismissed,
    completed,
    completedCount,
    isCompleted,
    complete,
    setMinimized,
    dismiss,
    reopen,
  };
});

export default useOnboardingStore;
