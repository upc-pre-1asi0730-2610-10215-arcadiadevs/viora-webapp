<script setup>
/**
 * SettingsOverviewView.
 * Tabs: Profile, Referrals, Security. Profile is the primary focus of this
 * bounded context. Referrals and Security integrate with BillingStore and
 * SecurityStore respectively.
 *
 * @component
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';
import { useProfileStore } from '../../application/profile.store.js';

// ── Stores ─────────────────────────────────────────────────────────────
const store = useProfileStore();

// BillingStore (Referrals tab) — may not exist yet; gracefully degrade.
let billing = null;
try {
    const mod = await import('../../../billing/application/billing.store.js');
    billing = mod.useBillingStore();
} catch {
    // Billing bounded context not yet ported; referrals tab renders placeholders.
}

// SecurityStore (Security tab)
let security = null;
try {
    const mod = await import('../../../iam/application/security.store.js');
    security = mod.useSecurityStore();
} catch {
    // Security bounded context not yet available.
}

// ── Tabs ───────────────────────────────────────────────────────────────
const tabs = [
    { id: 'profile', label: 'Profile', icon: 'pi pi-user' },
    { id: 'referrals', label: 'Referrals', icon: 'pi pi-gift' },
    { id: 'security', label: 'Security', icon: 'pi pi-shield' },
];

const activeTab = ref('profile');
const loadedTabs = new Set();

// ── Breadcrumbs ────────────────────────────────────────────────────────
const breadcrumbs = computed(() => {
    const current = tabs.find((t) => t.id === activeTab.value);
    return [
        { label: 'Settings', disabled: true },
        { label: current?.label ?? 'Profile', disabled: true },
    ];
});

// ── Language options ───────────────────────────────────────────────────
const languageOptions = ['English', 'Español', 'Português'];

// ── Profile draft ──────────────────────────────────────────────────────
const fullName = ref('');
const email = ref('');
const phone = ref('');
const jobTitle = ref('');
const language = ref('');
const location = ref('');
const specialtyArea = ref('');

const applyDraftFrom = (profile) => {
    fullName.value = profile.fullName;
    email.value = profile.email;
    phone.value = profile.phone;
    jobTitle.value = profile.jobTitle;
    language.value = profile.language;
    location.value = profile.location;
    specialtyArea.value = profile.specialtyArea;
};

watch(
    () => store.profile,
    (p) => applyDraftFrom(p),
    { immediate: true },
);

const preview = computed(() =>
    store.profile.withChanges({
        fullName: fullName.value,
        specialtyArea: specialtyArea.value,
        location: location.value,
        totalHectares: store.farmTotalHectares,
        plotCount: store.farmPlotCount,
    }),
);

// ── Referrals state ────────────────────────────────────────────────────
const codeCopied = ref(false);
const redeemInput = ref('');
const selectedCoupon = ref(null);
const conditionsExpanded = ref(true);
const couponCodeCopied = ref(false);

const couponTransform = ref('rotateX(0deg) rotateY(0deg)');
const glossX = ref('50%');
const glossY = ref('-20%');

const referralTerms = [
    'Valid for one subscription discount per completed referral — the invited producer must finish plot onboarding and connect at least one IoT device.',
    'The discount applies automatically to your next billing cycle once the referral qualifies.',
    'You can hold a maximum of 5 active referral coupons per account at any time.',
    'Not combinable with other Subscription promotions or annual-billing discounts.',
    'Viora may modify or revoke referral coupons in cases of suspected abuse or fraudulent referrals.',
];

// ── Security state ─────────────────────────────────────────────────────
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordMessage = ref(null);
const deactivateModalOpen = ref(false);
const accountDeactivated = ref(false);

const canUpdatePassword = computed(
    () =>
        currentPassword.value.length > 0 &&
        newPassword.value.length >= 8 &&
        newPassword.value === confirmPassword.value &&
        !(security?.changingPassword?.value),
);

// ── Tab activation ─────────────────────────────────────────────────────
function selectTab(tabId) {
    activeTab.value = tabId;
    ensureTabData(tabId);
}

function ensureTabData(tabId) {
    if (loadedTabs.has(tabId)) return;
    loadedTabs.add(tabId);
    if (tabId === 'referrals' && billing) {
        billing.load();
    } else if (tabId === 'security' && security) {
        security.loadSessions();
    }
}

// ── Actions ────────────────────────────────────────────────────────────
function resetDraft() {
    store.load();
    store.loadFarmTotals();
    if (activeTab.value === 'referrals' && billing) {
        billing.load();
    } else if (activeTab.value === 'security' && security) {
        security.loadSessions();
    }
}

function saveChanges() {
    store.save({
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        jobTitle: jobTitle.value.trim(),
        language: language.value,
        location: location.value.trim(),
        specialtyArea: specialtyArea.value.trim(),
    });
}

// ── Referrals actions ──────────────────────────────────────────────────
function copyReferralCode() {
    const code = billing?.referralCode?.code;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
        codeCopied.value = true;
        setTimeout(() => (codeCopied.value = false), 2000);
    });
}

function shareReferral() {
    if (!billing?.referralCode) return;
    const referral = billing.referralCode;
    const shareData = {
        title: 'Join me on Viora',
        text: `Use my referral code ${referral.code} to join Viora.`,
        url: referral.shareLink,
    };
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard?.writeText(referral.shareLink);
        codeCopied.value = true;
        setTimeout(() => (codeCopied.value = false), 2000);
    }
}

function redeemCoupon() {
    const code = redeemInput.value.trim();
    if (!code || !billing?.redeeming?.value) return;
    billing.redeem(code, (ok) => {
        if (ok) redeemInput.value = '';
    });
}

function selectCoupon(coupon) {
    selectedCoupon.value = coupon;
    conditionsExpanded.value = true;
    couponCodeCopied.value = false;
    couponTransform.value = 'rotateX(0deg) rotateY(0deg)';
    glossX.value = '50%';
    glossY.value = '-20%';
}

function backToCoupons() {
    selectedCoupon.value = null;
}

function toggleConditions() {
    conditionsExpanded.value = !conditionsExpanded.value;
}

function copyCouponCode(coupon) {
    if (!coupon.code) return;
    navigator.clipboard?.writeText(coupon.code).then(() => {
        couponCodeCopied.value = true;
        setTimeout(() => (couponCodeCopied.value = false), 2000);
    });
}

function onCouponMove(event) {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 16;
    const rotX = (0.5 - py) * 12;
    couponTransform.value = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    glossX.value = `${(px * 100).toFixed(1)}%`;
    glossY.value = `${(py * 100).toFixed(1)}%`;
}

function onCouponLeave() {
    couponTransform.value = 'rotateX(0deg) rotateY(0deg)';
}

// ── Security actions ───────────────────────────────────────────────────
function updatePassword() {
    passwordMessage.value = null;
    if (newPassword.value.length < 8) {
        passwordMessage.value = { tone: 'error', text: 'New password must be at least 8 characters.' };
        return;
    }
    if (newPassword.value !== confirmPassword.value) {
        passwordMessage.value = { tone: 'error', text: 'New password and confirmation do not match.' };
        return;
    }
    security?.changePassword(
        { currentPassword: currentPassword.value, newPassword: newPassword.value },
        (ok, message) => {
            if (ok) {
                passwordMessage.value = { tone: 'ok', text: 'Password updated successfully.' };
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
            } else {
                passwordMessage.value = { tone: 'error', text: message ?? 'Could not update your password.' };
            }
        },
    );
}

function signOutSession(sessionId) {
    security?.revokeSession(sessionId);
}

function openDeactivate() {
    deactivateModalOpen.value = true;
}

function closeDeactivate() {
    deactivateModalOpen.value = false;
}

function confirmDeactivate() {
    security?.deactivateAccount((ok) => {
        if (ok) {
            accountDeactivated.value = true;
            deactivateModalOpen.value = false;
        }
    });
}

// ── Init ───────────────────────────────────────────────────────────────
onMounted(() => {
    store.load();
    store.loadFarmTotals();
});
</script>

<template>
  <section class="settings-page">
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      subtitle="Manage your account, marketplace visibility, and security preferences."
      :updated-label="store.lastSyncLabel"
      @refresh="resetDraft"
    />

    <!-- Section tabs -->
    <nav class="settings-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="settings-tab"
        :class="{ 'is-active': activeTab === tab.id }"
        :aria-selected="activeTab === tab.id"
        @click="selectTab(tab.id)"
      >
        <i :class="tab.icon"></i>
        {{ tab.label }}
      </button>
    </nav>

    <!-- ============ PROFILE ============ -->
    <div v-if="activeTab === 'profile'" class="profile-grid">
      <!-- Left column: editable forms -->
      <div class="editor-column">
        <!-- Personal information -->
        <pv-card class="section-card">
          <template #content>
            <div class="section-head">
              <div>
                <h2 class="section-title">Personal information</h2>
                <p class="section-subtitle">Your name and contact details as seen by specialists.</p>
              </div>
            </div>

            <div class="identity-row">
              <span class="avatar avatar--lg">{{ preview.initials }}</span>
              <div class="identity-text">
                <span class="identity-name">{{ fullName || 'Your name' }}</span>
                <span class="identity-role">{{ jobTitle || 'Job title' }} &middot; {{ store.profile.roleLabel }}</span>
              </div>
            </div>

            <div class="form-grid">
              <label class="field">
                <span>Full name</span>
                <pv-input-text v-model="fullName" type="text" />
              </label>
              <label class="field">
                <span>Email address</span>
                <pv-input-text v-model="email" type="email" />
              </label>
              <label class="field">
                <span>Phone number</span>
                <pv-input-text v-model="phone" type="tel" />
              </label>
              <label class="field">
                <span>Job title</span>
                <pv-input-text v-model="jobTitle" type="text" />
              </label>
            </div>

            <div class="form-grid">
              <label class="field field--inline">
                <span>Language</span>
                <pv-dropdown
                  v-model="language"
                  :options="languageOptions"
                  placeholder="Select language"
                />
              </label>
            </div>

            <div class="card-actions">
              <pv-button
                type="button"
                class="save-btn"
                :disabled="store.saving"
                :label="store.saving ? 'Saving\u2026' : 'Save changes'"
                @click="saveChanges"
              />
            </div>
          </template>
        </pv-card>

        <!-- Marketplace visibility -->
        <pv-card class="section-card">
          <template #content>
            <div class="section-head">
              <div>
                <h2 class="section-title">Marketplace visibility</h2>
                <p class="section-subtitle">
                  Shown on your profile card when specialists receive your assistance requests.
                </p>
              </div>
            </div>

            <div class="form-grid">
              <label class="field">
                <span>Grove focus</span>
                <pv-input-text v-model="specialtyArea" placeholder="e.g. Olive oil production" />
              </label>
              <label class="field">
                <span>Location</span>
                <pv-input-text v-model="location" placeholder="e.g. Valle de Ica, Peru" />
              </label>
            </div>

            <div class="field">
              <span>Total farmed area</span>
              <div class="readonly-metric">
                <i class="pi pi-leaf metric-icon"></i>
                <strong>{{ preview.farmSizeLabel }}</strong>
                <span class="readonly-hint">Summed automatically from your plots in My Plots.</span>
              </div>
            </div>
          </template>
        </pv-card>
      </div>

      <!-- Right column: live preview -->
      <aside class="preview-column">
        <p class="preview-caption">How specialists see your request</p>

        <div class="preview-card">
          <div class="preview-badges">
            <span class="badge badge--best"><i class="pi pi-leaf"></i> Producer</span>
          </div>

          <div class="preview-identity">
            <span class="avatar">{{ preview.initials }}</span>
            <div class="identity-text">
              <span class="preview-name">{{ preview.fullName || 'Your name' }}</span>
              <span class="preview-role">{{ preview.specialtyArea || 'Grove focus' }}</span>
            </div>
          </div>

          <div class="preview-meta">
            <span v-if="preview.location"><i class="pi pi-map-marker"></i> {{ preview.location }}</span>
            <span><i class="pi pi-leaf"></i> {{ preview.farmSizeLabel }}</span>
          </div>

          <div class="preview-foot">
            <pv-button type="button" class="save-btn" label="Respond" disabled />
          </div>
        </div>

        <p class="preview-note">
          <i class="pi pi-info-circle"></i>
          This preview updates live as you edit. It is exactly what a specialist sees when you send an assistance
          request from Expert Assistance.
        </p>
      </aside>
    </div>

    <!-- ============ REFERRALS ============ -->
    <div v-if="activeTab === 'referrals'">
      <pv-card class="section-card">
        <template #content>
          <div class="section-head">
            <div>
              <h2 class="section-title">Referrals</h2>
              <p class="section-subtitle">Invite others to Viora. Grow the ecosystem together.</p>
            </div>
          </div>

          <div class="referral-body">
            <div class="referral-left">
              <h3 class="referral-headline">
                Refer a friend and earn a {{ billing?.referralCode?.rewardPercent || 20 }}% discount coupon.
              </h3>

              <img
                class="referral-illustration"
                src="/assets/images/general/referrals-image.png"
                alt="Refer a friend to Viora"
              />

              <button type="button" class="referral-code-ticket" @click="copyReferralCode">
                <span class="ticket-label">Your referral code</span>
                <span class="ticket-code">{{ billing?.referralCode?.code || '————' }}</span>
                <span class="ticket-hint">{{ codeCopied ? 'Copied!' : 'Tap to copy' }}</span>
              </button>
            </div>

            <div class="referral-right">
              <div class="referral-step">
                <span class="step-num">1</span>
                <span class="step-text">Send an invite to a partner.</span>
              </div>
              <div class="referral-step">
                <span class="step-num">2</span>
                <span class="step-text">Your partner signs up.</span>
              </div>
              <div class="referral-step">
                <span class="step-num">3</span>
                <span class="step-text">You will be able to claim your coupon when your partner registers for the first time.</span>
              </div>

              <pv-button type="button" class="save-btn block" label="Refer a partner by text, email or more" @click="shareReferral" />
            </div>
          </div>
        </template>
      </pv-card>

      <pv-card class="section-card">
        <template #content>
          <div class="section-head">
            <div>
              <h2 class="section-title">Coupons</h2>
              <p class="section-subtitle">{{ selectedCoupon ? 'Coupon details and conditions.' : 'Do you have a coupon?' }}</p>
            </div>
            <pv-button
              v-if="selectedCoupon"
              type="button"
              class="ghost-btn"
              label="Back"
              icon="pi pi-arrow-left"
              @click="backToCoupons"
            />
          </div>

          <!-- Coupon list -->
          <template v-if="!selectedCoupon">
            <div class="redeem-row">
              <pv-input-text
                v-model="redeemInput"
                placeholder="Enter a coupon code, e.g. WELCOME10"
                class="redeem-input"
                @keydown.enter="redeemCoupon"
              />
              <pv-button
                type="button"
                class="save-btn"
                :disabled="!redeemInput.trim() || billing?.redeeming"
                :label="billing?.redeeming ? 'Redeeming\u2026' : 'Redeem'"
                @click="redeemCoupon"
              />
            </div>
            <p v-if="billing?.redeemError" class="field-error">{{ billing.redeemError }}</p>

            <div class="coupon-grid">
              <template v-if="billing?.coupons?.length">
                <button
                  v-for="coupon in billing.coupons"
                  :key="coupon.id"
                  type="button"
                  class="coupon-card"
                  @click="selectCoupon(coupon)"
                >
                  <div class="coupon-content">
                    <div class="coupon-head">
                      <i class="pi pi-ticket"></i>
                      <span class="coupon-kind">coupon</span>
                    </div>
                    <span class="coupon-code">{{ coupon.code }}</span>
                    <span class="coupon-desc">{{ coupon.description }}</span>
                    <div class="coupon-foot">
                      <span class="coupon-link">View conditions</span>
                      <span v-if="coupon.validUntilLabel" class="coupon-valid">{{ coupon.validUntilLabel }}</span>
                    </div>
                  </div>
                  <img class="coupon-thumb" src="/assets/images/general/coupon-image.png" alt="Viora coupon" />
                </button>
              </template>
              <p v-else class="empty-hint">No coupons yet. Redeem a code or refer a partner to earn one.</p>
            </div>
          </template>

          <!-- Selected coupon detail -->
          <template v-else>
            <div class="coupon-detail">
              <div
                class="coupon-tilt"
                :style="{ transform: couponTransform, '--gx': glossX, '--gy': glossY }"
                @pointermove="onCouponMove"
                @pointerleave="onCouponLeave"
              >
                <div class="coupon-3d">
                  <div class="coupon-face coupon-front">
                    <span class="cf-gloss"></span>
                    <div class="cf-head">
                      <span class="cf-brand">Viora Referrals</span>
                      <span class="cf-type">COUPON<br />TYPE {{ selectedCoupon.typeLabel }}</span>
                    </div>
                    <div class="cf-offer">
                      <span class="cf-percent">{{ selectedCoupon.discountPercent }}%</span>
                      <span class="cf-sub">{{ selectedCoupon.discountSubtitle }}</span>
                    </div>
                    <div class="cf-codebox">
                      <span class="cf-code">{{ selectedCoupon.code }}</span>
                      <button type="button" class="cf-copy" @click="copyCouponCode(selectedCoupon)">
                        <i class="pi pi-copy"></i> {{ couponCodeCopied ? 'Copied' : 'Copy code' }}
                      </button>
                    </div>
                    <span class="cf-valid">
                      {{ selectedCoupon.validUntilLong ? 'Valid until ' + selectedCoupon.validUntilLong + ' or while credits last.' : 'Valid while credits last.' }}
                    </span>
                    <span class="cf-notch cf-notch-left"></span>
                    <span class="cf-notch cf-notch-right"></span>
                  </div>
                  <div class="coupon-face coupon-back">
                    <span class="cb-year">{{ selectedCoupon.yearShort }}</span>
                    <span class="cb-serial">{{ selectedCoupon.monthLabel }}<br />{{ selectedCoupon.serialLabel }}</span>
                    <div class="cb-brand">
                      <span class="cb-name">Viora</span>
                      <span class="cb-tag">Referrals</span>
                    </div>
                    <span class="cb-leaf"><i class="pi pi-leaf"></i></span>
                  </div>
                </div>
              </div>

              <button type="button" class="conditions-toggle" @click="toggleConditions">
                View conditions <i :class="conditionsExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
              </button>

              <div v-if="conditionsExpanded" class="terms-card">
                <h3 class="terms-title">Terms &amp; conditions</h3>
                <ul class="terms-list">
                  <li v-for="term in referralTerms" :key="term">{{ term }}</li>
                </ul>
              </div>
            </div>
          </template>
        </template>
      </pv-card>
    </div>

    <!-- ============ SECURITY ============ -->
    <div v-if="activeTab === 'security'">
      <!-- Password -->
      <pv-card class="section-card">
        <template #content>
          <div class="section-head">
            <div>
              <h2 class="section-title">Password</h2>
              <p class="section-subtitle">Use at least 8 characters.</p>
            </div>
          </div>

          <label class="field">
            <span>Current password</span>
            <pv-input-text v-model="currentPassword" type="password" autocomplete="current-password" />
          </label>

          <div class="form-grid">
            <label class="field">
              <span>New password</span>
              <pv-input-text v-model="newPassword" type="password" autocomplete="new-password" />
            </label>
            <label class="field">
              <span>Confirm new password</span>
              <pv-input-text v-model="confirmPassword" type="password" autocomplete="new-password" />
            </label>
          </div>

          <p v-if="passwordMessage" class="field-message" :class="{ 'is-ok': passwordMessage.tone === 'ok', 'is-error': passwordMessage.tone === 'error' }">
            {{ passwordMessage.text }}
          </p>

          <div class="card-actions">
            <pv-button
              type="button"
              class="save-btn"
              :disabled="!canUpdatePassword"
              :label="security?.changingPassword ? 'Updating\u2026' : 'Update password'"
              @click="updatePassword"
            />
          </div>
        </template>
      </pv-card>

      <!-- Active sessions -->
      <pv-card class="section-card">
        <template #content>
          <div class="section-head">
            <div>
              <h2 class="section-title">Active sessions</h2>
              <p class="section-subtitle">{{ security?.sessions?.length || 0 }} devices signed in</p>
            </div>
          </div>

          <div class="session-list">
            <template v-if="security?.loadingSessions && (!security?.sessions?.length)">
              <div class="empty-hint">Loading sessions\u2026</div>
            </template>
            <template v-else-if="security?.sessions?.length">
              <div v-for="session in security.sessions" :key="session.id" class="session-row">
                <span class="session-icon"><i :class="session.icon"></i></span>
                <div class="session-text">
                  <span class="session-title">{{ session.title }}</span>
                  <span class="session-sub">{{ session.subtitle }}</span>
                </div>
                <span v-if="session.current" class="session-current">This device</span>
                <pv-button
                  v-else
                  type="button"
                  class="ghost-btn ghost-btn--sm"
                  label="Sign out"
                  @click="signOutSession(session.id)"
                />
              </div>
            </template>
          </div>
        </template>
      </pv-card>

      <!-- Danger zone -->
      <pv-card class="section-card danger-card">
        <template #content>
          <div class="section-head">
            <div>
              <h2 class="section-title">Danger zone</h2>
              <p class="section-subtitle">
                Deactivating your account revokes access for you and pauses monitoring on all linked plots.
              </p>
            </div>
          </div>

          <p v-if="accountDeactivated" class="field-message is-error">Your account has been deactivated.</p>
          <pv-button
            v-else
            type="button"
            class="danger-btn"
            label="Deactivate account"
            @click="openDeactivate"
          />
        </template>
      </pv-card>
    </div>

    <!-- Deactivate confirmation modal -->
    <pv-dialog v-model:visible="deactivateModalOpen" modal :closable="true" header="Deactivate account" class="deactivate-dialog">
      <p class="modal-subtitle">This revokes your access and pauses monitoring on all linked plots.</p>
      <p class="modal-body-text">
        Are you sure you want to deactivate your account? You won't be able to sign in until it is reactivated.
      </p>
      <template #footer>
        <pv-button type="button" class="ghost-btn" label="Cancel" @click="closeDeactivate" />
        <pv-button
          type="button"
          class="danger-btn"
          :disabled="security?.deactivating"
          :label="security?.deactivating ? 'Deactivating\u2026' : 'Deactivate account'"
          @click="confirmDeactivate"
        />
      </template>
    </pv-dialog>
  </section>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 8px 4px 40px;
}

/* ---------- Section tabs ---------- */
.settings-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.settings-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid #ece6db;
  background: #ffffff;
  color: #6f6a62;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.settings-tab i {
  font-size: 14px;
}

.settings-tab:hover {
  border-color: #d9d2c6;
  color: #333333;
}

.settings-tab.is-active {
  background: #2e4a3a;
  border-color: #2e4a3a;
  color: #ffffff;
}

/* ---------- Layout ---------- */
.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.editor-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 12px;
}

/* ---------- Section (card) ---------- */
.section-card {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.section-card :deep(.p-card-body) {
  padding: 22px 24px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}

.section-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: #828282;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Identity row ---------- */
.identity-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0ece4;
}

.avatar {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #2e4a3a;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
}

.avatar--lg {
  width: 52px;
  height: 52px;
  font-size: 16px;
}

.identity-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.identity-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}

.identity-role {
  font-size: 13px;
  font-weight: 400;
  color: #828282;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Forms ---------- */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-grid:last-of-type {
  margin-bottom: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field > span {
  font-size: 13px;
  font-weight: 500;
  color: #333333;
  font-family: 'Poppins', sans-serif;
}

.field :deep(.p-inputtext) {
  height: 44px;
  padding: 0 12px;
  border: 1px solid #e2ddd4;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #333333;
  background: #ffffff;
}

.field :deep(.p-inputtext:focus) {
  border-color: #2e4a3a;
  box-shadow: none;
}

.field :deep(.p-dropdown) {
  height: 44px;
  border: 1px solid #e2ddd4;
  border-radius: 10px;
}

.card-actions {
  margin-top: 22px;
}

/* ---------- Read-only metric ---------- */
.readonly-metric {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  background: #f8f4ed;
}

.metric-icon {
  font-size: 16px;
  color: #2e4a3a;
}

.readonly-metric strong {
  font-size: 14px;
  font-weight: 600;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}

.readonly-hint {
  font-size: 12px;
  font-weight: 400;
  color: #8c877f;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Preview column ---------- */
.preview-caption {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #8c877f;
  font-family: 'Poppins', sans-serif;
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #ece6db;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.preview-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  background: #ffffff;
  color: #4f4f4f;
  font-family: 'Poppins', sans-serif;
}

.badge i {
  font-size: 12px;
}

.badge--best {
  background: #57eba1;
  color: #2e4a3a;
}

.preview-identity {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.preview-name {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  font-family: 'Poppins', sans-serif;
}

.preview-role {
  font-size: 12px;
  font-weight: 400;
  color: #333333;
  font-family: 'Poppins', sans-serif;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-meta span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #4f4f4f;
  font-family: 'Poppins', sans-serif;
}

.preview-meta i {
  font-size: 14px;
  color: #8c877f;
}

.preview-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid #ece6db;
}

.preview-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  color: #8c877f;
  line-height: 1.5;
  font-family: 'Poppins', sans-serif;
}

.preview-note i {
  flex: 0 0 auto;
  font-size: 14px;
  color: #8c877f;
}

/* ---------- Buttons ---------- */
.save-btn {
  background: #2e4a3a !important;
  border-color: #2e4a3a !important;
  color: #ffffff !important;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
}

.save-btn.block {
  width: 100%;
}

.ghost-btn {
  background: #ffffff !important;
  border: 1px solid #e2ddd4 !important;
  color: #333333 !important;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
}

.ghost-btn--sm {
  height: 36px;
  padding: 0 14px;
  font-size: 12px;
}

.danger-btn {
  background: #ffffff !important;
  border: 1px solid #e6b8b8 !important;
  color: #d63b3b !important;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
}

.danger-card {
  border: 1px solid #f2dede;
}

/* ---------- Referrals ---------- */
.referral-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
}

.referral-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}

.referral-headline {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2523;
  line-height: 1.3;
  font-family: 'Poppins', sans-serif;
}

.referral-illustration {
  width: 100%;
  max-width: 260px;
  height: auto;
  object-fit: contain;
  position: relative;
  z-index: 1;
  margin-bottom: -18px;
  pointer-events: none;
}

.referral-code-ticket {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 56px 18px 22px;
  border: 2px dashed #cfc6b6;
  border-radius: 14px;
  background: #faf7f1;
  cursor: pointer;
  font-family: 'Poppins', sans-serif;
  position: relative;
  z-index: 0;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.referral-code-ticket:hover {
  border-color: #2e4a3a;
  background: #f4efe6;
}

.ticket-label {
  font-size: 13px;
  font-weight: 400;
  color: #8c877f;
}

.ticket-code {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1f2523;
}

.ticket-hint {
  font-size: 12px;
  font-weight: 500;
  color: #2e7d55;
}

.referral-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.referral-step {
  display: flex;
  align-items: center;
  gap: 16px;
}

.step-num {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0ebe3;
  color: #1f2523;
  font-size: 20px;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
}

.step-text {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  line-height: 1.4;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Coupons ---------- */
.redeem-row {
  display: flex;
  gap: 10px;
}

.redeem-input {
  flex: 1;
  height: 44px;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.coupon-card {
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #ece6db;
  background: #faf7f1;
  text-align: left;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.coupon-card:hover {
  border-color: #2e4a3a;
  box-shadow: 0 10px 24px rgba(31, 37, 35, 0.08);
  transform: translateY(-2px);
}

.coupon-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.coupon-thumb {
  flex: 0 0 auto;
  align-self: flex-start;
  width: 96px;
  height: auto;
  object-fit: contain;
}

.coupon-head {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e4a3a;
}

.coupon-kind {
  font-size: 14px;
  font-weight: 500;
  color: #4f4f4f;
}

.coupon-code {
  font-size: 18px;
  font-weight: 700;
  color: #1f2523;
}

.coupon-desc {
  font-size: 13px;
  font-weight: 400;
  color: #6f6a62;
}

.coupon-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.coupon-link {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 16px;
  border-radius: 10px;
  background: #2e4a3a;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
}

.coupon-valid {
  font-size: 12px;
  font-weight: 400;
  color: #8c877f;
}

.empty-hint {
  grid-column: 1 / -1;
  margin: 0;
  padding: 8px 0;
  font-size: 13px;
  color: #8a8f8b;
  font-family: 'Poppins', sans-serif;
}

.field-error {
  margin: 10px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: #d63b3b;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Coupon detail (selected) ---------- */
.coupon-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: min(460px, 100%);
  margin: 8px auto 0;
  perspective: 1400px;
  animation: coupon-detail-in 0.4s ease-out both;
}

.coupon-tilt {
  width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.18s ease-out;
  will-change: transform;
}

@keyframes coupon-detail-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.coupon-3d {
  position: relative;
  width: 100%;
  height: 300px;
  transform-style: preserve-3d;
  animation: coupon-flip-in 1.15s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes coupon-flip-in {
  0% { transform: rotateY(0deg) scale(0.92); }
  100% { transform: rotateY(360deg) scale(1); }
}

.coupon-face {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  padding: 28px 30px;
  background: #22392c;
  color: #f4efe6;
  box-shadow: 0 18px 40px rgba(31, 37, 35, 0.22);
  backface-visibility: hidden;
  overflow: hidden;
}

.coupon-front {
  transform: rotateY(0deg);
  display: flex;
  flex-direction: column;
}

.cf-gloss {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: radial-gradient(
    circle at var(--gx, 50%) var(--gy, -20%),
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.02) 28%,
    rgba(255, 255, 255, 0) 56%
  );
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  transition: opacity 0.34s ease;
}

.coupon-tilt:hover .cf-gloss {
  opacity: 0.36;
}

.coupon-back {
  transform: rotateY(180deg);
}

.cf-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(244, 239, 230, 0.22);
}

.cf-brand {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #cdd9cf;
  font-family: 'Poppins', sans-serif;
}

.cf-type {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1px;
  text-align: right;
  color: #9fb0a2;
  line-height: 1.4;
  font-family: 'Poppins', sans-serif;
}

.cf-offer {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
}

.cf-percent {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
}

.cf-sub {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #dfe7e0;
  max-width: 60%;
  line-height: 1.3;
  font-family: 'Poppins', sans-serif;
}

.cf-codebox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 18px;
  box-sizing: border-box;
  min-height: 52px;
  padding: 12px 16px;
  border: 1px solid rgba(244, 239, 230, 0.35);
  border-radius: 10px;
}

.cf-code {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
}

.cf-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: #cdd9cf;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.cf-copy:hover {
  color: #ffffff;
}

.cf-valid {
  margin-top: 14px;
  font-size: 11px;
  font-weight: 400;
  color: #9fb0a2;
  font-family: 'Poppins', sans-serif;
}

.cf-notch {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  transform: translateY(-50%);
}

.cf-notch-left {
  left: -11px;
}

.cf-notch-right {
  right: -11px;
}

.cb-year {
  position: absolute;
  top: 22px;
  left: 24px;
  font-size: 13px;
  font-weight: 500;
  color: #9fb0a2;
  font-family: 'Poppins', sans-serif;
}

.cb-serial {
  position: absolute;
  top: 22px;
  right: 24px;
  text-align: right;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
  color: #9fb0a2;
  line-height: 1.5;
  padding-bottom: 10px;
  font-family: 'Poppins', sans-serif;
}

.cb-brand {
  position: absolute;
  left: 24px;
  bottom: 26px;
  display: flex;
  flex-direction: column;
}

.cb-name {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
}

.cb-tag {
  margin-top: 2px;
  font-size: 15px;
  font-weight: 500;
  color: #9fb0a2;
  font-family: 'Poppins', sans-serif;
}

.cb-leaf {
  position: absolute;
  right: -10px;
  bottom: -18px;
  color: rgba(244, 239, 230, 0.06);
}

.cb-leaf i {
  font-size: 120px;
}

.conditions-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.terms-card {
  width: 100%;
  padding: 20px 22px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #ece6db;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
  animation: coupon-detail-in 0.3s ease-out both;
}

.terms-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}

.terms-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.terms-list li {
  font-size: 13px;
  font-weight: 400;
  color: #6f6a62;
  line-height: 1.5;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Security ---------- */
.field-message {
  margin: 14px 0 0;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

.field-message.is-ok {
  color: #2e7d55;
}

.field-message.is-error {
  color: #d63b3b;
}

.session-list {
  display: flex;
  flex-direction: column;
}

.session-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 0;
  border-top: 1px solid #f0ece4;
}

.session-row:first-child {
  border-top: none;
}

.session-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f0ebe3;
  color: #4f4f4f;
}

.session-icon i {
  font-size: 18px;
}

.session-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-right: auto;
}

.session-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}

.session-sub {
  font-size: 12px;
  font-weight: 400;
  color: #828282;
  font-family: 'Poppins', sans-serif;
}

.session-current {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(87, 235, 161, 0.2);
  color: #2e7d55;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Modal ---------- */
.modal-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6f6a62;
  font-family: 'Poppins', sans-serif;
}

.modal-body-text {
  margin: 0;
  font-size: 14px;
  color: #4f4f4f;
  line-height: 1.5;
  font-family: 'Poppins', sans-serif;
}

/* ---------- Responsive ---------- */
@media (max-width: 1080px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
  .preview-column {
    position: static;
  }
  .referral-body {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .coupon-grid {
    grid-template-columns: 1fr;
  }
}
</style>
