<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';
import { FAQ_ARTICLES, FAQ_CATEGORIES, LEGAL_DOCUMENTS } from '../support-content.js';

const router = useRouter();

const activeTab = ref('faq');
const searchQuery = ref('');
const selectedCategory = ref('all');
const expandedId = ref(null);
const openDoc = ref(null);

const breadcrumbs = computed(() => [
    { label: 'Support', disabled: true },
    { label: activeTab.value === 'legal' ? 'Legal' : 'FAQ', disabled: true },
]);

const categories = computed(() => {
    const counts = FAQ_CATEGORIES.map((category) => ({
        label: category,
        count: FAQ_ARTICLES.filter((a) => a.category === category).length,
    }));
    return [{ label: 'All articles', count: FAQ_ARTICLES.length }, ...counts];
});

const filteredArticles = computed(() => {
    const category = selectedCategory.value;
    const query = searchQuery.value.trim().toLowerCase();
    return FAQ_ARTICLES.filter((article) => {
        const matchesCategory = category === 'all' || article.category === category;
        const matchesQuery =
            query.length === 0 ||
            article.question.toLowerCase().includes(query) ||
            article.answer.toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
    });
});

const currentCategoryLabel = computed(() =>
    selectedCategory.value === 'all' ? 'All articles' : selectedCategory.value,
);

function selectTab(tab) {
    activeTab.value = tab;
}

function selectCategory(label) {
    selectedCategory.value = label === 'All articles' ? 'all' : label;
    expandedId.value = null;
}

function isCategoryActive(label) {
    return (label === 'All articles' && selectedCategory.value === 'all') ||
        label === selectedCategory.value;
}

function toggleArticle(id) {
    expandedId.value = expandedId.value === id ? null : id;
}

function goToExperts() {
    router.push('/assistance');
}

function viewLegal() {
    activeTab.value = 'legal';
}
</script>

<template>
    <section class="support-page">
        <DashboardHeader
            :breadcrumbs="breadcrumbs"
            subtitle="Find answers, reach a specialist, or review your account's legal agreements."
            updatedLabel="Just now" />

        <!-- Search -->
        <div class="search-bar">
            <i class="pi pi-search search-icon"></i>
            <input
                v-model="searchQuery"
                type="text"
                placeholder='Search help articles, e.g. "NDVI thresholds" or "invite a teammate"'
                @input="selectTab('faq')" />
        </div>

        <!-- Top cards -->
        <div class="top-cards">
            <div class="top-card">
                <span class="top-icon"><i class="pi pi-users"></i></span>
                <h2 class="top-title">Expert Assistance</h2>
                <p class="top-sub">For urgent field issues — routes directly to an on-call specialist.</p>
                <div class="top-foot">
                    <span class="tag tag--green">Priority</span>
                    <button type="button" class="ghost-button" @click="goToExperts()">Go to Experts</button>
                </div>
            </div>

            <div class="top-card">
                <span class="top-icon"><i class="pi pi-file"></i></span>
                <h2 class="top-title">Legal documents</h2>
                <p class="top-sub">Terms, privacy policy, SLA, and device warranty.</p>
                <div class="top-foot">
                    <span class="tag tag--muted">{{ LEGAL_DOCUMENTS.length }} documents</span>
                    <button type="button" class="ghost-button" @click="viewLegal()">View</button>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <nav class="support-tabs" role="tablist">
            <button
                type="button"
                role="tab"
                class="support-tab"
                :class="{ 'is-active': activeTab === 'faq' }"
                @click="selectTab('faq')">
                FAQ
            </button>
            <button
                type="button"
                role="tab"
                class="support-tab"
                :class="{ 'is-active': activeTab === 'legal' }"
                @click="selectTab('legal')">
                Legal
            </button>
        </nav>

        <!-- ============ FAQ ============ -->
        <template v-if="activeTab === 'faq'">
            <div class="faq-grid">
                <!-- Categories -->
                <div class="section-card categories-card">
                    <span class="categories-title">CATEGORIES</span>
                    <ul class="category-list">
                        <li v-for="category in categories" :key="category.label">
                            <button
                                type="button"
                                class="category-item"
                                :class="{ 'is-active': isCategoryActive(category.label) }"
                                @click="selectCategory(category.label)">
                                <span class="category-label">{{ category.label }}</span>
                                <span class="category-count">{{ category.count }}</span>
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Articles -->
                <div class="section-card articles-card">
                    <div class="articles-head">
                        <h2 class="section-title">{{ currentCategoryLabel }}</h2>
                        <p class="section-subtitle">{{ filteredArticles.length }} articles</p>
                    </div>

                    <div class="article-list">
                        <template v-if="filteredArticles.length > 0">
                            <div
                                v-for="article in filteredArticles"
                                :key="article.id"
                                class="article"
                                :class="{ 'is-open': expandedId === article.id }">
                                <button
                                    type="button"
                                    class="article-head"
                                    @click="toggleArticle(article.id)">
                                    <span class="article-q">{{ article.question }}</span>
                                    <i :class="expandedId === article.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                                </button>
                                <p v-if="expandedId === article.id" class="article-answer">{{ article.answer }}</p>
                            </div>
                        </template>
                        <div v-else class="articles-empty">No articles match your search.</div>
                    </div>
                </div>
            </div>
        </template>

        <!-- ============ LEGAL ============ -->
        <template v-if="activeTab === 'legal'">
            <div class="legal-grid">
                <div v-for="doc in LEGAL_DOCUMENTS" :key="doc.id" class="section-card legal-card">
                    <div class="legal-head">
                        <span class="legal-icon"><i :class="doc.icon"></i></span>
                        <div>
                            <h2 class="legal-title">{{ doc.title }}</h2>
                            <p class="legal-summary">{{ doc.summary }}</p>
                        </div>
                    </div>
                    <div class="legal-foot">
                        <button type="button" class="ghost-button" @click="openDoc = doc">
                            Read full document
                        </button>
                        <span class="legal-updated">Last updated {{ doc.lastUpdated }}</span>
                    </div>
                </div>
            </div>
        </template>
    </section>

    <!-- Legal document reader modal -->
    <Teleport to="body">
        <div v-if="openDoc" class="modal-overlay" @click.self="openDoc = null">
            <div class="modal" @click.stop>
                <div class="modal-head">
                    <div>
                        <h2>{{ openDoc.title }}</h2>
                        <p class="modal-subtitle">Last updated {{ openDoc.lastUpdated }}</p>
                    </div>
                    <button type="button" class="modal-close-btn" @click="openDoc = null">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <div class="doc-body">
                    <p class="doc-intro">{{ openDoc.intro }}</p>
                    <div v-for="(section, i) in openDoc.sections" :key="section.heading" class="doc-section">
                        <h3 class="doc-heading">{{ i + 1 }}. {{ section.heading }}</h3>
                        <p class="doc-text">{{ section.body }}</p>
                    </div>
                    <p class="doc-footnote">This summary is provided for convenience within the Viora app.</p>
                </div>

                <div class="modal-actions">
                    <button type="button" class="primary-button" @click="openDoc = null">Close</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.support-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 8px 4px 40px;
}

/* ---------- Search ---------- */
.search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    height: 60px;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.search-icon {
    color: #8c877f;
}

.search-bar input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #333333;
}

.search-bar input::placeholder {
    color: #a7a29a;
}

/* ---------- Top cards ---------- */
.top-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.top-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 22px 24px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.top-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f0ebe3;
    color: #2e4a3a;
    margin-bottom: 4px;
}

.top-icon i {
    font-size: 20px;
}

.top-title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1f2523;
}

.top-sub {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
    line-height: 1.45;
}

.top-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
    padding-top: 14px;
}

.tag {
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

.tag--green {
    background: rgba(87, 235, 161, 0.2);
    color: #2e7d55;
}

.tag--muted {
    background: #f0ebe3;
    color: #8c877f;
}

/* ---------- Tabs ---------- */
.support-tabs {
    display: flex;
    gap: 8px;
}

.support-tab {
    height: 40px;
    padding: 0 22px;
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

.support-tab:hover {
    border-color: #d9d2c6;
    color: #333333;
}

.support-tab.is-active {
    background: #2e4a3a;
    border-color: #2e4a3a;
    color: #ffffff;
}

/* ---------- Cards ---------- */
.section-card {
    padding: 22px 24px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1f2523;
}

.section-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
}

/* ---------- FAQ ---------- */
.faq-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 2.4fr);
    gap: 20px;
    align-items: start;
}

.categories-card {
    padding: 20px 18px;
}

.categories-title {
    display: block;
    margin-bottom: 12px;
    padding: 0 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #a7a29a;
}

.category-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #4f4f4f;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.category-item:hover {
    background: #f7f4ef;
}

.category-item.is-active {
    background: #f0f7f4;
    color: #2e4a3a;
}

.category-count {
    font-size: 13px;
    font-weight: 500;
    color: #a7a29a;
}

.category-item.is-active .category-count {
    color: #2e4a3a;
}

.articles-head {
    margin-bottom: 8px;
}

.article-list {
    display: flex;
    flex-direction: column;
}

.article {
    border-top: 1px solid #f0ece4;
}

.article:first-child {
    border-top: none;
}

.article-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    padding: 18px 4px;
    border: none;
    background: transparent;
    color: #1f2523;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
}

.article-head i {
    flex: 0 0 auto;
    color: #8c877f;
}

.article-q {
    line-height: 1.4;
}

.article-answer {
    margin: 0;
    padding: 0 4px 20px;
    font-size: 14px;
    font-weight: 400;
    color: #6f6a62;
    line-height: 1.6;
}

.articles-empty {
    min-height: 90px;
    display: grid;
    place-items: center;
    color: #8a8f8b;
    font-size: 14px;
}

/* ---------- Legal ---------- */
.legal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.legal-card {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.legal-head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
}

.legal-icon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f0ebe3;
    color: #2e4a3a;
}

.legal-icon i {
    font-size: 20px;
}

.legal-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2523;
}

.legal-summary {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
    line-height: 1.45;
}

.legal-foot {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: auto;
}

.legal-updated {
    font-size: 13px;
    font-weight: 400;
    color: #a7a29a;
}

/* ---------- Buttons ---------- */
.ghost-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0 18px;
    border-radius: 10px;
    border: 1px solid #e2ddd4;
    background: #ffffff;
    color: #333333;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
}

.ghost-button:hover {
    border-color: #d9d2c6;
    color: #1f2523;
}

.primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    padding: 0 22px;
    border-radius: 10px;
    border: none;
    background: #2e4a3a;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
}

.primary-button:hover {
    background: #3d6350;
}

/* ---------- Legal reader modal ---------- */
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
    width: min(680px, 100%);
    max-height: 88vh;
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

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6f6a62;
}

.modal-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #6f6a62;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.modal-close-btn:hover {
    background: #f0ece4;
    color: #1f2523;
}

.doc-body {
    overflow-y: auto;
    padding-right: 6px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.doc-intro {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    color: #4f4f4f;
    line-height: 1.6;
}

.doc-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.doc-heading {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2523;
}

.doc-text {
    margin: 0;
    font-size: 13px;
    font-weight: 400;
    color: #6f6a62;
    line-height: 1.65;
}

.doc-footnote {
    margin: 4px 0 0;
    font-size: 12px;
    font-style: italic;
    color: #a7a29a;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
}

/* ---------- Responsive ---------- */
@media (max-width: 960px) {
    .top-cards,
    .legal-grid {
        grid-template-columns: 1fr;
    }
    .faq-grid {
        grid-template-columns: 1fr;
    }
}
</style>
