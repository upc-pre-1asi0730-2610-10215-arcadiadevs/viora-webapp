<template>
  <section class="assistance-page">
    <dashboard-header
      :breadcrumbs="breadcrumbs"
      subtitle="Track this assistance case and coordinate the field visit with the specialist."
      :updated-label="store.lastSyncLabel"
      @refresh="refresh"
    />

    <template v-if="!request">
      <pv-card class="section-card">
        <template #content>
          <div class="requests-state">Case not found. It may have been closed or reassigned.</div>
          <pv-button type="button" class="ghost-button" @click="backToOverview">
            <i class="pi pi-arrow-left"></i> Back to expert assistance
          </pv-button>
        </template>
      </pv-card>
    </template>

    <template v-else>
      <!-- KPI cards -->
      <section class="kpi-grid">
        <pv-card class="kpi-card">
          <template #content>
            <div class="kpi-head">
              <h2>Case status</h2>
              <span :class="['kpi-pill', phase === 'accepted' ? 'kpi-pill--green' : 'kpi-pill--soft']">
                {{ phase === 'accepted' ? 'Accepted' : (phase === 'declined' ? 'Declined' : 'Pending') }}
              </span>
            </div>
            <span class="kpi-value">{{ caseStatusLabel }}</span>
            <p class="kpi-foot">{{ caseStatusCaption }}</p>
          </template>
        </pv-card>

        <pv-card class="kpi-card">
          <template #content>
            <div class="kpi-head"><h2>Specialist</h2></div>
            <template v-if="specialist">
              <div class="mini-specialist">
                <span class="avatar avatar--sm">{{ specialist.initials }}</span>
                <div class="identity-text">
                  <span class="specialist-name">{{ specialist.name }}</span>
                  <span class="specialist-role">{{ specialist.role }}</span>
                </div>
              </div>
              <p class="kpi-foot">{{ specialist.distanceLabel }} &middot; {{ specialist.availabilityLabel }}</p>
            </template>
          </template>
        </pv-card>

        <pv-card :class="['kpi-card', { 'kpi-card--alert': linkedAlert?.severity === 'Critical' }]">
          <template #content>
            <div class="kpi-head">
              <h2>Linked alert</h2>
              <span v-if="linkedAlert" :class="['pill', severityClass(linkedAlert.severity)]">
                {{ linkedAlert.severity }}
              </span>
            </div>
            <span class="kpi-value">{{ linkedAlert?.typeLabel ?? 'Pest symptom report' }}</span>
            <p class="kpi-foot">{{ alertSummary }}</p>
          </template>
        </pv-card>

        <pv-card class="kpi-card">
          <template #content>
            <div class="kpi-head">
              <h2>Contact access</h2>
              <span :class="['kpi-pill', contactUnlocked ? 'kpi-pill--green' : 'kpi-pill--muted']">
                {{ contactUnlocked ? 'Unlocked' : 'Locked' }}
              </span>
            </div>
            <span class="kpi-value kpi-value--lock">
              <i :class="contactUnlocked ? 'pi pi-lock-open' : 'pi pi-lock'"></i>
              {{ contactUnlocked ? 'Unlocked' : 'Locked' }}
            </span>
            <p class="kpi-foot">
              {{ contactUnlocked ? 'Direct contact is now available below.' : 'Accept the proposal to unlock direct contact.' }}
            </p>
          </template>
        </pv-card>
      </section>

      <div class="detail-grid">
        <!-- Left column: service proposal -->
        <div class="detail-col">
          <pv-card class="section-card">
            <template #content>
              <div class="section-head">
                <div>
                  <h2 class="section-title">Service proposal</h2>
                  <p class="section-subtitle">
                    {{ phase === 'awaiting'
                        ? 'Waiting for the specialist to submit a proposal.'
                        : 'Read-only proposal submitted by the specialist.' }}
                  </p>
                </div>
                <span v-if="phase !== 'awaiting' && phase !== 'declined'" class="tag-blue">
                  Received {{ proposalData.receivedDate }}
                </span>
              </div>

              <template v-if="phase === 'awaiting'">
                <div class="pending-block">
                  <span class="pending-icon"><i class="pi pi-clock"></i></span>
                  <strong>Proposal pending</strong>
                  <p>
                    {{ specialist?.name }} has received your request and is preparing a service proposal.
                    You'll be notified when it's ready.
                  </p>
                </div>
                <div class="proposal-actions">
                  <pv-button type="button" class="ghost-button" disabled>
                    <i class="pi pi-check"></i> Accept proposal
                  </pv-button>
                  <pv-button type="button" class="ghost-button" @click="openDecline">
                    <i class="pi pi-times"></i> Decline proposal
                  </pv-button>
                </div>
              </template>

              <template v-else-if="phase === 'declined'">
                <div class="pending-block">
                  <span class="pending-icon pending-icon--muted"><i class="pi pi-search"></i></span>
                  <strong>Proposal declined</strong>
                  <p>Specialist search has been reactivated for this alert. Choose another specialist to continue.</p>
                </div>
                <div class="proposal-actions">
                  <pv-button type="button" class="primary-button" @click="backToOverview">
                    <i class="pi pi-search"></i> Find another specialist
                  </pv-button>
                </div>
              </template>

              <template v-else>
                <div class="proposal-rows">
                  <div class="proposal-row">
                    <span>Proposed service</span>
                    <strong>{{ proposalData.proposedService }}</strong>
                  </div>
                  <div class="proposal-row">
                    <span>Estimated visit date</span>
                    <strong>{{ proposalData.visitDate }}</strong>
                  </div>
                  <div class="proposal-row">
                    <span>Estimated duration</span>
                    <strong>{{ proposalData.duration }}</strong>
                  </div>
                  <div class="proposal-row proposal-row--scope">
                    <span>Scope</span>
                    <ul class="scope-list">
                      <li v-for="item in proposalData.scope" :key="item">
                        <i class="pi pi-check"></i> {{ item }}
                      </li>
                    </ul>
                  </div>
                  <div class="proposal-row">
                    <span>Estimated cost</span>
                    <strong class="proposal-cost">{{ proposalData.cost }}</strong>
                  </div>
                </div>

                <div class="notes-box" v-if="proposalData.notes">
                  <strong>Notes from specialist</strong>
                  <p>{{ proposalData.notes }}</p>
                </div>

                <template v-if="phase === 'proposal'">
                  <div class="proposal-actions">
                    <pv-button type="button" class="ghost-button" @click="openDecline">
                      <i class="pi pi-times"></i> Decline proposal
                    </pv-button>
                    <pv-button type="button" class="primary-button" @click="handleAcceptProposal">
                      <i class="pi pi-check"></i> Accept proposal
                    </pv-button>
                  </div>
                </template>
                <template v-else>
                  <div class="accepted-banner">
                    <i class="pi pi-check-circle"></i> Proposal accepted &middot; visit scheduled {{ contactData.visitScheduled }}
                  </div>
                </template>
              </template>
            </template>
          </pv-card>
        </div>

        <!-- Right column: specialist profile + contact + timeline -->
        <div class="detail-col">
          <pv-card class="section-card">
            <template #content>
              <div class="section-head">
                <h2 class="section-title">Specialist profile</h2>
                <pv-button type="button" class="ghost-button ghost-button--sm">View full profile</pv-button>
              </div>

              <template v-if="specialist">
                <div class="profile-head">
                  <span class="avatar">{{ specialist.initials }}</span>
                  <div class="identity-text">
                    <span class="specialist-name">{{ specialist.name }}</span>
                    <span class="specialist-role">{{ specialist.role }}</span>
                  </div>
                  <span class="foot-availability avail-today"><i class="dot"></i> Available</span>
                </div>

                <div class="profile-stats">
                  <div class="profile-stat">
                    <span><i class="pi pi-verified"></i> Success rate</span>
                    <strong>{{ specialist.successRate }}%</strong>
                  </div>
                  <div class="profile-stat">
                    <span><i class="pi pi-history"></i> Cases handled</span>
                    <strong>{{ specialist.caseCount }}</strong>
                  </div>
                  <div class="profile-stat">
                    <span><i class="pi pi-map-marker"></i> Distance</span>
                    <strong>{{ specialist.distanceLabel }}</strong>
                  </div>
                </div>
              </template>
            </template>
          </pv-card>

          <!-- Contact specialist -->
          <template v-if="contactUnlocked">
            <pv-card class="section-card">
              <template #content>
                <div class="unlocked-head">
                  <span class="unlocked-icon"><i class="pi pi-lock-open"></i></span>
                  <div>
                    <h2 class="section-title">Contact unlocked</h2>
                    <p class="section-subtitle">The proposal has been accepted. Coordinate the field visit directly with the specialist.</p>
                  </div>
                </div>

                <div class="contact-specialist">
                  <span class="avatar">{{ specialist?.initials }}</span>
                  <div class="identity-text">
                    <span class="specialist-name">{{ specialist?.name }}</span>
                    <span class="specialist-role">Visit scheduled &middot; {{ contactData.visitScheduled }}</span>
                  </div>
                  <span class="pill status-proposal">Accepted</span>
                </div>

                <div class="contact-rows">
                  <div class="contact-row">
                    <div><span class="contact-label">Phone</span><strong>{{ contactData.phone }}</strong></div>
                    <pv-button type="button" class="ghost-button ghost-button--sm" @click="copy(contactData.phone)">
                      <i class="pi pi-copy"></i> Copy
                    </pv-button>
                  </div>
                  <div class="contact-row">
                    <div><span class="contact-label">Email</span><strong>{{ contactData.email }}</strong></div>
                    <pv-button type="button" class="ghost-button ghost-button--sm" @click="copy(contactData.email)">
                      <i class="pi pi-copy"></i> Copy
                    </pv-button>
                  </div>
                  <div class="contact-row">
                    <div><span class="contact-label">WhatsApp</span><strong>{{ contactData.whatsapp }}</strong></div>
                    <pv-button type="button" class="ghost-button ghost-button--sm" @click="openWhatsApp">
                      <i class="pi pi-comments"></i> Open
                    </pv-button>
                  </div>
                </div>

                <p class="info-note">
                  <i class="pi pi-info-circle"></i>
                  Contact details are only visible to you and will remain accessible for the duration of the case.
                </p>

                <pv-button type="button" class="ghost-button block" @click="openWhatsApp">
                  <i class="pi pi-comments"></i> Open WhatsApp
                </pv-button>
                <pv-button type="button" class="ghost-button block" @click="backToOverview">
                  <i class="pi pi-arrow-left"></i> Back to case detail
                </pv-button>
              </template>
            </pv-card>
          </template>
          <template v-else>
            <pv-card class="section-card">
              <template #content>
                <h2 class="section-title">Contact specialist</h2>
                <div class="locked-box">
                  <span class="locked-icon"><i class="pi pi-lock"></i></span>
                  <strong>Contact details locked</strong>
                  <p>Contact details will be available after accepting the proposal.</p>
                  <pv-button type="button" class="ghost-button" disabled>
                    <i class="pi pi-phone"></i> Contact specialist
                  </pv-button>
                </div>
              </template>
            </pv-card>
          </template>

          <!-- Case timeline -->
          <template v-if="phase === 'proposal' || phase === 'accepted'">
            <pv-card class="section-card">
              <template #content>
                <h2 class="section-title">Case timeline</h2>
                <div class="timeline">
                  <div v-for="event in timeline" :key="event.label" class="timeline-row">
                    <span :class="['timeline-dot', 'dot--' + event.tone]"></span>
                    <div class="timeline-body">
                      <strong>{{ event.label }}</strong>
                      <span>{{ event.timestamp }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </pv-card>
          </template>
        </div>
      </div>
    </template>
  </section>

  <!-- Decline proposal modal -->
  <pv-dialog v-model:visible="declineOpen" modal :closable="false">
    <template #header>
      <div>
        <h2>Decline proposal</h2>
        <p class="modal-subtitle">This will cancel the current proposal and return you to specialist search.</p>
      </div>
    </template>

    <div class="warning-box">
      <i class="pi pi-exclamation-triangle"></i>
      Declining this proposal will reactivate the specialist search for this alert. The specialist will be notified.
    </div>

    <div class="field">
      <span>Proposal from</span>
      <div class="field-readonly">
        <span class="avatar avatar--xs">{{ specialist?.initials }}</span>
        {{ specialist?.name }} &middot; {{ proposalData.cost }}
      </div>
    </div>

    <label class="field">
      <span>Reason for declining (optional)</span>
      <pv-textarea
        v-model="declineReason"
        rows="3"
        placeholder="e.g. Budget too high, preferred a different availability..."
      />
    </label>

    <template #footer>
      <pv-button type="button" class="ghost-button" @click="declineOpen = false">Cancel</pv-button>
      <pv-button type="button" class="ghost-button" @click="confirmDecline">
        <i class="pi pi-times"></i> Decline proposal
      </pv-button>
    </template>
  </pv-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';
import { useInterventionStore } from '../../application/intervention.store.js';
import { useSurveillanceStore } from '../../../surveillance/application/surveillance.store.js';
import { useAgronomicStore } from '../../../agronomic/application/agronomic.store.js';
import { useExpenseStore } from '../../../agronomic/application/expense.store.js';
import { ServiceProposal } from '../../domain/model/service-proposal.entity.js';

const store = useInterventionStore();
const surveillance = useSurveillanceStore();
const agronomic = useAgronomicStore();
const expense = useExpenseStore();
const route = useRoute();
const router = useRouter();

const caseCode = ref('');
const plots = ref([]);
const loadedCaseId = ref(null);

const declineOpen = ref(false);
const declineReason = ref('');

const request = computed(() => store.findRequestByCode(caseCode.value));

const breadcrumbs = computed(() => [
    { label: 'Expert Assistance', route: '/assistance/expert-assistance' },
    { label: 'Case Detail', disabled: true },
    { label: caseCode.value || '\u2014', disabled: true },
]);

const specialist = computed(() => {
    const specialistId = request.value?.specialistId ?? null;
    if (specialistId == null) return null;
    return (
        store.specialists.find((s) => String(s.id) === String(specialistId)) ??
        store.specialists[0] ??
        null
    );
});

const linkedAlert = computed(() => {
    const alertId = request.value?.alertId ?? null;
    if (alertId == null) return null;
    return surveillance.alerts.find((a) => String(a.id) === String(alertId)) ?? null;
});

const phase = computed(() => {
    switch (request.value?.status) {
        case 'PROPOSAL_RECEIVED': return 'proposal';
        case 'ACCEPTED': return 'accepted';
        case 'DECLINED': return 'declined';
        default: return 'awaiting';
    }
});

const contactUnlocked = computed(() => phase.value === 'accepted');

const caseStatusLabel = computed(() => {
    switch (phase.value) {
        case 'proposal': return 'Proposal received';
        case 'accepted': return 'Proposal accepted';
        case 'declined': return 'Proposal declined';
        default: return 'Awaiting response';
    }
});

const caseStatusCaption = computed(() => {
    switch (phase.value) {
        case 'proposal': return 'Review the proposal and accept to schedule the field visit.';
        case 'accepted': return 'Proposal accepted. Coordinate the visit with the specialist.';
        case 'declined': return 'Proposal declined. Specialist search has been reactivated.';
        default: return 'Request sent. Waiting for specialist to evaluate availability.';
    }
});

const alertSummary = computed(() => {
    const alert = linkedAlert.value;
    const plot = plots.value.find((p) => String(p.id) === String(request.value?.plotId));
    const location = plot?.name ?? alert?.plot?.name ?? 'Plot';
    const date = alert?.formattedDate ?? 'Recent';
    return `${location} \u00b7 ${date}`;
});

const proposalData = computed(() => {
    const proposal = store.activeProposal;
    const req = request.value;
    return {
        receivedDate: ServiceProposal.formatDate(req?.updatedAt ?? req?.createdAt ?? null),
        proposedService: proposal?.serviceTitle || 'Field inspection and phytosanitary evaluation',
        visitDate: proposal?.proposedDateLabel ?? '\u2014',
        duration: proposal?.durationLabel || '\u2014',
        scope: proposal?.scope ?? [],
        cost: proposal?.costLabel ?? '\u2014',
        notes: proposal?.proposalDetails || '',
    };
});

const contactData = computed(() => {
    const contact = store.activeContact;
    const proposal = store.activeProposal;
    return {
        phone: contact?.phone || '\u2014',
        email: contact?.email || '\u2014',
        whatsapp: contact?.whatsapp ?? '',
        visitScheduled: proposal?.proposedDateLabel ?? '\u2014',
    };
});

const timeline = computed(() => {
    const req = request.value;
    if (!req) return [];
    const events = [
        { label: 'Request sent', timestamp: formatDateTime(req.createdAt), tone: 'done' },
    ];
    if (store.activeProposal) {
        events.push({
            label: 'Proposal received',
            timestamp: formatDateTime(req.updatedAt),
            tone: phase.value === 'proposal' ? 'active' : 'done',
        });
    }
    if (phase.value === 'accepted') {
        events.push({
            label: 'Proposal accepted',
            timestamp: formatDateTime(req.updatedAt),
            tone: 'active',
        });
    }
    return events.reverse();
});

onMounted(() => {
    caseCode.value = route.params.code ?? '';
    if (surveillance.alerts.length === 0) {
        surveillance.fetchAlerts(50);
    }
    agronomic.fetchPlots().then(() => {
        plots.value = agronomic.plots;
    });
    if (!request.value) {
        store.loadAllRequests();
    }
});

watch(() => request.value, (req) => {
    if (req && req.id != null && req.id !== loadedCaseId.value) {
        loadedCaseId.value = req.id;
        store.loadCaseArtifacts(req);
    }
}, { immediate: true });

function refresh() {
    surveillance.fetchAlerts(50);
    if (request.value) {
        store.loadCaseArtifacts(request.value);
    }
}

function formatDateTime(raw) {
    if (!raw) return '\u2014';
    const timestamp = Date.parse(raw);
    if (Number.isNaN(timestamp)) return '\u2014';
    const date = new Date(timestamp);
    const datePart = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
    const timePart = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
    return `${datePart} \u00b7 ${timePart}`;
}

function severityClass(severity) {
    return `severity-${(severity ?? 'Low').toLowerCase()}`;
}

function handleAcceptProposal() {
    const code = caseCode.value;
    if (code) {
        store.acceptProposal(code, (ok) => {
            if (ok) registerSpecialistExpense();
        });
    }
}

/**
 * Records the accepted proposal's cost through Agronomic so the expense
 * classification remains owned by that bounded context. Best-effort: a failure
 * here doesn't block acceptance.
 */
function registerSpecialistExpense() {
    const proposal = store.activeProposal;
    if (!request.value || request.value.plotId == null || proposal?.amount == null) return;

    expense.recordFromSpecialistIntervention({
        plotId: Number(request.value.plotId),
        interventionReferenceCode: request.value.referenceCode,
        amount: proposal.amount,
        currency: proposal.currency ?? 'PEN',
        serviceTitle: proposal.serviceTitle,
    });
}

function openDecline() {
    declineReason.value = '';
    declineOpen.value = true;
}

function confirmDecline() {
    const code = caseCode.value;
    if (code) {
        store.declineProposal(code, declineReason.value);
    }
    declineOpen.value = false;
    backToOverview();
}

function copy(value) {
    navigator.clipboard?.writeText(value);
}

function openWhatsApp() {
    if (!contactData.value.whatsapp) return;
    const number = contactData.value.whatsapp.replace(/[^\d]/g, '');
    if (!number) return;
    window.open(`https://wa.me/${number}`, '_blank');
}

function backToOverview() {
    const plotId = request.value?.plotId ?? null;
    router.push(
        plotId != null
            ? { name: 'intervention-expert-assistance', query: { plot: plotId } }
            : { name: 'intervention-expert-assistance' },
    );
}
</script>
