<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';
import { useSubscriptionStore } from '../../application/subscription.store.js';
import { useAgronomicStore } from '../../../agronomic/application/agronomic.store.js';

const store = useSubscriptionStore();
const agronomicStore = useAgronomicStore();
const route = useRoute();

/** Result banner shown when MercadoPago redirects back after a payment. */
const paymentResult = ref(null);

const breadcrumbs = [
    { label: 'Subscription', disabled: true },
    { label: 'Overview', disabled: true },
];

// Real usage, derived from My Plots / IoT devices.
const plotsUsed = ref(0);
const iotUsed = ref(0);

// Modal state.
const confirmPlan = ref(null);
const cancelModalOpen = ref(false);
const paymentModalOpen = ref(false);

const plotUsagePct = computed(() => {
    const limit = store.currentPlan?.plotLimit ?? 0;
    return limit > 0 ? Math.min(100, Math.round((plotsUsed.value / limit) * 100)) : 0;
});

const iotUsagePct = computed(() => {
    const limit = store.currentPlan?.iotLimit ?? 0;
    return limit > 0 ? Math.min(100, Math.round((iotUsed.value / limit) * 100)) : 0;
});

/** The annual plan offered for the "Switch to annual" shortcut. */
const annualPlan = computed(() =>
    store.plans.find((p) => p.interval === 'ANNUAL') ?? null,
);

onMounted(() => {
    store.load();
    loadUsage();
    readPaymentReturn();
});

/** Reads MercadoPago's redirect status (approved/pending/failure) if present. */
function readPaymentReturn() {
    const params = route.query;
    const status = params.status ?? params.collection_status;
    if (status === 'approved' || status === 'success') {
        paymentResult.value = 'approved';
    } else if (status === 'pending' || status === 'in_process') {
        paymentResult.value = 'pending';
    } else if (status === 'failure' || status === 'rejected') {
        paymentResult.value = 'failure';
    }
}

function dismissPaymentResult() {
    paymentResult.value = null;
}

function refresh() {
    store.load();
    loadUsage();
}

function loadUsage() {
    agronomicStore.fetchPlots();
    agronomicStore.fetchIotDevices();
    // Usage counts update reactively when plots/iotDevices change
    updateUsageCounts();
}

function updateUsageCounts() {
    // Derive counts from store data
    plotsUsed.value = agronomicStore.plots.length;
    iotUsed.value = agronomicStore.iotDevices.length;
}

function isCurrentPlan(plan) {
    return store.subscription?.planCode === plan.code;
}

// ----- Plan switching -----

function openSwitch(plan) {
    store.clearError();
    confirmPlan.value = plan;
}

function switchToAnnual() {
    const plan = annualPlan.value;
    if (plan) openSwitch(plan);
}

function closeSwitch() {
    confirmPlan.value = null;
}

function confirmSwitch() {
    const plan = confirmPlan.value;
    if (plan) store.startCheckout(plan.code, plan.interval);
}

function scrollToPlans() {
    document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ----- Cancel -----

function openCancel() {
    cancelModalOpen.value = true;
}

function closeCancel() {
    cancelModalOpen.value = false;
}

function confirmCancel() {
    store.cancel((ok) => {
        if (ok) cancelModalOpen.value = false;
    });
}

// ----- Payment method -----

function openPayment() {
    paymentModalOpen.value = true;
}

function closePayment() {
    paymentModalOpen.value = false;
}
</script>

<template>
    <section class="subscription-page">
        <DashboardHeader
            :breadcrumbs="breadcrumbs"
            subtitle="Manage your plan and review billing history."
            updatedLabel="Just now"
            @refresh="refresh()" />

        <!-- Payment result banners -->
        <div v-if="paymentResult === 'approved'" class="banner banner--success">
            <i class="pi pi-check-circle banner-icon"></i>
            Payment approved — your plan is being updated. Refresh in a moment if it isn't reflected yet.
            <button type="button" class="banner-close" @click="dismissPaymentResult()">
                <i class="pi pi-times"></i>
            </button>
        </div>
        <div v-else-if="paymentResult === 'pending'" class="banner banner--info">
            <i class="pi pi-clock banner-icon"></i>
            Payment pending confirmation. Your plan updates as soon as MercadoPago confirms it.
            <button type="button" class="banner-close" @click="dismissPaymentResult()">
                <i class="pi pi-times"></i>
            </button>
        </div>
        <div v-else-if="paymentResult === 'failure'" class="banner banner--error">
            <i class="pi pi-exclamation-circle banner-icon"></i>
            The payment could not be completed. No changes were made — you can try again.
            <button type="button" class="banner-close" @click="dismissPaymentResult()">
                <i class="pi pi-times"></i>
            </button>
        </div>

        <div v-if="store.error" class="banner banner--error">
            <i class="pi pi-exclamation-circle banner-icon"></i> {{ store.error }}
        </div>

        <div class="subscription-grid">
            <!-- ============ LEFT COLUMN ============ -->
            <div class="col">
                <!-- Current plan hero -->
                <div class="section-card">
                    <div class="plan-hero-head">
                        <i class="pi pi-crown hero-icon"></i>
                        <div>
                            <h2 class="card-title">{{ store.subscription?.planName || store.currentPlan?.name || 'Your plan' }}</h2>
                            <p class="hero-sub">{{ store.subscription?.renewalCaption || 'Manage your subscription' }}</p>
                        </div>
                    </div>

                    <div class="hero-divider"></div>

                    <div class="hero-price">
                        <span class="money">{{ store.currentPlan?.priceLabel || store.subscription?.priceLabel || '—' }}</span>
                        <span class="money-interval">{{ store.currentPlan?.intervalSuffix || store.subscription?.intervalSuffix }}</span>
                    </div>

                    <div class="usage-list">
                        <div class="usage">
                            <div class="usage-head">
                                <span class="usage-label">Plots monitored</span>
                                <span class="usage-count">{{ plotsUsed }} of {{ store.currentPlan?.plotLimit ?? '—' }} used</span>
                            </div>
                            <div class="usage-bar"><span class="usage-fill" :style="{ width: plotUsagePct + '%' }"></span></div>
                        </div>
                        <div class="usage">
                            <div class="usage-head">
                                <span class="usage-label">IoT devices connected</span>
                                <span class="usage-count">{{ iotUsed }} of {{ store.currentPlan?.iotLimit ?? '—' }} used</span>
                            </div>
                            <div class="usage-bar"><span class="usage-fill" :style="{ width: iotUsagePct + '%' }"></span></div>
                        </div>
                    </div>

                    <div class="hero-actions">
                        <button type="button" class="primary-button" @click="scrollToPlans()">Change plan</button>
                        <button
                            v-if="annualPlan && !store.subscription?.isAnnual"
                            type="button"
                            class="ghost-button"
                            @click="switchToAnnual()">
                            Switch to annual
                        </button>
                    </div>
                </div>

                <!-- Available plans -->
                <div id="available-plans" class="section-card">
                    <div class="section-head">
                        <div>
                            <h2 class="card-title"><i class="pi pi-star-fill title-icon"></i> Available plans</h2>
                            <p class="card-sub">Compare tiers and switch anytime — changes apply at the next billing cycle.</p>
                        </div>
                    </div>

                    <div class="plan-grid">
                        <div
                            v-for="plan in store.plans"
                            :key="plan.code"
                            class="plan-card"
                            :class="{ 'is-current': isCurrentPlan(plan) }">
                            <span v-if="isCurrentPlan(plan)" class="plan-tag">Current plan</span>
                            <h3 class="plan-name">{{ plan.name }}</h3>
                            <div class="plan-price">
                                <span class="plan-amount">{{ plan.priceLabel }}</span>
                                <span class="plan-interval">{{ plan.intervalSuffix }}</span>
                            </div>
                            <p class="plan-tagline">{{ plan.tagline }}</p>

                            <ul class="plan-features">
                                <li v-for="feature in plan.features" :key="feature">
                                    <i class="pi pi-check"></i> {{ feature }}
                                </li>
                            </ul>

                            <button
                                v-if="isCurrentPlan(plan)"
                                type="button"
                                class="plan-btn plan-btn--current"
                                disabled>
                                Current plan
                            </button>
                            <button
                                v-else
                                type="button"
                                class="plan-btn plan-btn--switch"
                                :disabled="store.checkoutPending === plan.code"
                                @click="openSwitch(plan)">
                                {{ store.checkoutPending === plan.code ? 'Opening\u2026' : 'Switch plan' }}
                            </button>
                        </div>
                        <p v-if="store.plans.length === 0" class="empty-hint">Plans are unavailable right now.</p>
                    </div>
                </div>
            </div>

            <!-- ============ RIGHT COLUMN ============ -->
            <div class="col">
                <!-- Payment method -->
                <div class="section-card">
                    <div class="section-head">
                        <h2 class="card-title"><i class="pi pi-credit-card title-icon"></i> Payment method</h2>
                    </div>

                    <div v-if="store.defaultPaymentMethod" class="method-row">
                        <span class="method-icon"><i class="pi pi-credit-card"></i></span>
                        <div class="method-text">
                            <span class="method-name">{{ store.defaultPaymentMethod.label }}</span>
                            <span class="method-exp">{{ store.defaultPaymentMethod.expiresLabel }}</span>
                        </div>
                        <span v-if="store.defaultPaymentMethod.isDefault" class="method-default">default</span>
                    </div>
                    <p v-else class="empty-hint">No payment method on file yet.</p>

                    <button type="button" class="ghost-button" @click="openPayment()">
                        Update payment method
                    </button>
                </div>

                <!-- Next invoice -->
                <div class="section-card">
                    <div class="section-head">
                        <h2 class="card-title">Next invoice</h2>
                    </div>
                    <div class="kv-row">
                        <span class="kv-key">Amount due</span>
                        <span class="kv-val">{{ store.currentPlan?.priceLabel || '—' }}</span>
                    </div>
                    <div class="kv-divider"></div>
                    <div class="kv-row">
                        <span class="kv-key">Billing date</span>
                        <span class="kv-val">{{ store.subscription?.periodEndLabel || '—' }}</span>
                    </div>
                </div>

                <!-- Cancel subscription -->
                <div class="section-card">
                    <div class="section-head">
                        <h2 class="card-title">Cancel subscription</h2>
                    </div>
                    <p v-if="store.subscription?.isCanceled" class="cancel-note">
                        Your subscription is set to end on {{ store.subscription?.periodEndLabel }}. You keep access until then.
                    </p>
                    <template v-else>
                        <p class="cancel-note">
                            You'll lose access to dynamic nutrition, pest surveillance, and expert assistance at the end of the billing period.
                        </p>
                        <button type="button" class="ghost-button" @click="openCancel()">Cancel subscription</button>
                    </template>
                </div>

                <!-- Billing history -->
                <div class="section-card">
                    <div class="section-head">
                        <div>
                            <h2 class="card-title"><i class="pi pi-file title-icon"></i> Billing history</h2>
                            <p class="card-sub">Invoices from the last 6 billing cycles.</p>
                        </div>
                    </div>

                    <div class="history-table">
                        <div class="history-header">
                            <span>Date</span>
                            <span>Description</span>
                            <span>Amount</span>
                            <span>Status</span>
                            <span></span>
                        </div>
                        <div v-for="invoice in store.invoices" :key="invoice.id" class="history-row">
                            <span>{{ invoice.dateLabel }}</span>
                            <span>{{ invoice.description }}</span>
                            <span>{{ invoice.amountLabel }}</span>
                            <span><span class="pill" :class="{ 'pill--paid': invoice.isPaid }">{{ invoice.statusLabel }}</span></span>
                            <span>
                                <button type="button" class="download-btn" aria-label="Download invoice">
                                    <i class="pi pi-download"></i>
                                </button>
                            </span>
                        </div>
                        <div v-if="store.invoices.length === 0" class="history-state">No invoices yet.</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Confirm plan switch modal -->
    <div v-if="confirmPlan" class="modal-overlay" @click="closeSwitch()">
        <div class="modal" @click.stop>
            <div class="modal-head">
                <div>
                    <h2>Switch to {{ confirmPlan.name }}</h2>
                    <p class="modal-subtitle">Changes apply at your next billing cycle.</p>
                </div>
                <button type="button" @click="closeSwitch()"><i class="pi pi-times"></i></button>
            </div>

            <div class="switch-summary">
                <div class="summary-row"><span>Plan</span><strong>{{ confirmPlan.name }}</strong></div>
                <div class="summary-row"><span>Price</span><strong>{{ confirmPlan.priceLabel }} {{ confirmPlan.intervalSuffix }}</strong></div>
            </div>

            <p class="modal-note">
                <i class="pi pi-lock"></i>
                You'll be redirected to MercadoPago's secure checkout to complete the payment.
            </p>
            <p v-if="store.error" class="field-error">{{ store.error }}</p>

            <div class="modal-actions">
                <button type="button" class="ghost-button" @click="closeSwitch()">Cancel</button>
                <button
                    type="button"
                    class="primary-button"
                    :disabled="store.checkoutPending === confirmPlan.code"
                    @click="confirmSwitch()">
                    {{ store.checkoutPending === confirmPlan.code ? 'Redirecting\u2026' : 'Continue to payment' }}
                </button>
            </div>
        </div>
    </div>

    <!-- Cancel subscription confirmation modal -->
    <div v-if="cancelModalOpen" class="modal-overlay" @click="closeCancel()">
        <div class="modal" @click.stop>
            <div class="modal-head">
                <div>
                    <h2>Cancel subscription</h2>
                    <p class="modal-subtitle">This takes effect at the end of your billing period.</p>
                </div>
                <button type="button" @click="closeCancel()"><i class="pi pi-times"></i></button>
            </div>
            <p class="modal-body-text">
                You'll keep access to {{ store.subscription?.planName || 'your plan' }} until
                {{ store.subscription?.periodEndLabel || 'the period ends' }}, then lose dynamic nutrition, pest
                surveillance and expert assistance.
            </p>
            <div class="modal-actions">
                <button type="button" class="ghost-button" @click="closeCancel()">Keep plan</button>
                <button
                    type="button"
                    class="danger-button"
                    :disabled="store.canceling"
                    @click="confirmCancel()">
                    {{ store.canceling ? 'Canceling\u2026' : 'Cancel subscription' }}
                </button>
            </div>
        </div>
    </div>

    <!-- Update payment method modal -->
    <div v-if="paymentModalOpen" class="modal-overlay" @click="closePayment()">
        <div class="modal" @click.stop>
            <div class="modal-head">
                <div>
                    <h2>Update payment method</h2>
                    <p class="modal-subtitle">Your card is handled securely by MercadoPago.</p>
                </div>
                <button type="button" @click="closePayment()"><i class="pi pi-times"></i></button>
            </div>
            <p class="modal-body-text">
                Viora never stores your full card details. Your payment method updates automatically the next time you
                complete a payment through MercadoPago's secure checkout.
            </p>
            <div class="modal-actions">
                <button type="button" class="primary-button" @click="closePayment()">Got it</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.subscription-page {
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.subscription-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
}

.col {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ---------- Cards / shared ---------- */
.section-card {
    padding: 22px 24px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 20px;
}

.card-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1f2523;
}

.title-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
    color: #1f2523;
}

.card-sub {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
}

.empty-hint {
    margin: 0 0 14px;
    font-size: 13px;
    color: #8a8f8b;
}

.banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
}

.banner--error {
    background: rgba(255, 92, 92, 0.12);
    color: #d63b3b;
}

.banner--success {
    background: rgba(87, 235, 161, 0.16);
    color: #2e7d55;
}

.banner--info {
    background: rgba(91, 141, 239, 0.12);
    color: #3f6fd0;
}

.banner-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
}

.banner-close {
    margin-left: auto;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
}

/* ---------- Current plan hero ---------- */
.plan-hero-head {
    display: flex;
    align-items: center;
    gap: 12px;
}

.hero-icon {
    font-size: 24px;
    width: 24px;
    height: 24px;
    color: #2e4a3a;
}

.hero-sub {
    margin: 2px 0 0;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
}

.hero-divider,
.kv-divider {
    height: 1px;
    background: #f0ece4;
}

.hero-divider {
    margin: 18px 0 22px;
}

.hero-price {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.money {
    font-size: 40px;
    font-weight: 500;
    color: #2e4a3a;
    line-height: 1;
}

.money-interval {
    font-size: 14px;
    font-weight: 400;
    color: #4f4f4f;
}

.usage-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin: 26px 0 24px;
}

.usage-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
}

.usage-label,
.usage-count {
    font-size: 14px;
    font-weight: 500;
    color: #333333;
}

.usage-bar {
    height: 8px;
    border-radius: 999px;
    background: #eeeae3;
    overflow: hidden;
}

.usage-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: #2e4a3a;
    transition: width 0.3s ease;
}

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

/* ---------- Available plans ---------- */
.plan-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 20px;
}

.plan-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px 22px;
    border: 1px solid #2e4a3a;
    border-radius: 16px;
    background: #ffffff;
}

.plan-card.is-current {
    background: #f0f7f4;
}

.plan-tag {
    position: absolute;
    top: -14px;
    left: 22px;
    padding: 6px 16px;
    border-radius: 999px;
    background: #2e4a3a;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
}

.plan-name {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333333;
}

.plan-price {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.plan-amount {
    font-size: 32px;
    font-weight: 500;
    color: #333333;
    line-height: 1;
}

.plan-interval {
    font-size: 14px;
    font-weight: 400;
    color: #4f4f4f;
}

.plan-tagline {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    color: #4f4f4f;
    line-height: 1.4;
}

.plan-features {
    list-style: none;
    margin: 8px 0 20px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.plan-features li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14px;
    font-weight: 400;
    color: #4f4f4f;
    line-height: 1.4;
}

.plan-features .pi {
    flex: 0 0 auto;
    font-size: 18px;
    width: 18px;
    height: 18px;
    color: #2e4a3a;
}

.plan-btn {
    margin-top: auto;
    width: 100%;
    height: 46px;
    border-radius: 999px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}

.plan-btn--switch {
    background: #2e4a3a;
    color: #ffffff;
    border: 1px solid #2e4a3a;
}

.plan-btn--current {
    background: #e5ede8;
    color: #2e4a3a;
    border: 1px solid #e5ede8;
}

.plan-btn[disabled] {
    opacity: 1;
    cursor: default;
}

/* ---------- Payment method ---------- */
.method-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 1px solid #ece6db;
    border-radius: 12px;
    margin-bottom: 14px;
}

.method-icon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #2e4a3a;
    color: #ffffff;
}

.method-icon .pi {
    font-size: 20px;
    width: 20px;
    height: 20px;
}

.method-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.method-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2523;
}

.method-exp {
    font-size: 12px;
    font-weight: 400;
    color: #828282;
}

.method-default {
    margin-left: auto;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(91, 141, 239, 0.16);
    color: #3f6fd0;
    font-size: 12px;
    font-weight: 500;
}

/* ---------- Next invoice ---------- */
.kv-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
}

.kv-key {
    font-size: 14px;
    font-weight: 400;
    color: #4f4f4f;
}

.kv-val {
    font-size: 14px;
    font-weight: 500;
    color: #1f2523;
}

.kv-divider {
    margin: 10px 0;
}

/* ---------- Cancel ---------- */
.cancel-note {
    margin: 0 0 16px;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
    line-height: 1.5;
}

/* ---------- Billing history ---------- */
.history-table {
    display: grid;
}

.history-header,
.history-row {
    display: grid;
    grid-template-columns: minmax(84px, 1fr) minmax(120px, 1.4fr) minmax(64px, 0.8fr) minmax(64px, 0.9fr) 40px;
    align-items: center;
    gap: 10px;
}

.history-header {
    min-height: 44px;
    color: #6f6a62;
    font-size: 12px;
    font-weight: 500;
}

.history-row {
    min-height: 62px;
    border-top: 1px solid #f0ece4;
    font-size: 13px;
    color: #333333;
}

.history-state {
    min-height: 90px;
    display: grid;
    place-items: center;
    color: #8a8f8b;
    font-size: 13px;
}

.pill {
    display: inline-grid;
    place-items: center;
    min-height: 26px;
    padding: 0 12px;
    border-radius: 999px;
    background: #eeeeee;
    color: #6f6a62;
    font-size: 12px;
    font-weight: 500;
}

.pill--paid {
    background: rgba(87, 235, 161, 0.2);
    color: #2e7d55;
}

.download-btn {
    width: 34px;
    height: 34px;
    border: 1px solid #ece6db;
    border-radius: 8px;
    color: #6f6a62;
    background: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
}

.download-btn .pi {
    font-size: 18px;
    width: 18px;
    height: 18px;
}

/* ---------- Buttons ---------- */
.primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 24px;
    border-radius: 999px;
    background: #2e4a3a;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    border: none;
    cursor: pointer;
}

.primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.ghost-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 22px;
    border-radius: 999px;
    border: 1px solid #e2ddd4;
    background: #ffffff;
    color: #333333;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}

.danger-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 44px;
    padding: 0 22px;
    border-radius: 999px;
    border: 1px solid #e6b8b8;
    background: #ffffff;
    color: #d63b3b;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}

.danger-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* ---------- Modals ---------- */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(31, 37, 35, 0.45);
}

.modal {
    width: min(460px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px 26px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 24px 60px rgba(31, 37, 35, 0.25);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.modal-head h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2523;
}

.modal-head button {
    background: none;
    border: none;
    color: #6f6a62;
    cursor: pointer;
    padding: 0;
}

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6f6a62;
}

.modal-body-text {
    margin: 0;
    font-size: 14px;
    color: #4f4f4f;
    line-height: 1.5;
}

.switch-summary {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 18px;
    border-radius: 12px;
    background: #f7f4ef;
}

.summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: #6f6a62;
}

.summary-row strong {
    color: #1f2523;
    font-weight: 600;
}

.modal-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    font-size: 12px;
    color: #6f6a62;
    line-height: 1.5;
}

.modal-note .pi {
    flex: 0 0 auto;
    font-size: 16px;
    width: 16px;
    height: 16px;
    color: #8c877f;
}

.field-error {
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    color: #d63b3b;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 4px;
}

/* ---------- Responsive ---------- */
@media (max-width: 1080px) {
    .subscription-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 620px) {
    .plan-grid {
        grid-template-columns: 1fr;
    }
    .history-header {
        display: none;
    }
    .history-row {
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        padding: 12px 0;
    }
}
</style>
