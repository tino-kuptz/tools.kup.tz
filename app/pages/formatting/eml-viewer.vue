<script setup>
import { parseEml } from '~/utils/emlParser.js';

const { t } = useI18n();

useCustomI18nHead({
  title: t('pages.formatting.emlViewer.title'),
  meta: [
    {
      description: t('pages.formatting.emlViewer.description'),
    },
  ],
});

const parsed = ref(null);
const parseError = ref('');
const objectUrls = ref([]);

const fromToCcKeys = ['From', 'To', 'Cc'];

function revokeObjectUrls() {
  objectUrls.value.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (_) { }
  });
  objectUrls.value = [];
}

function getAttachmentUrl(blob) {
  const url = URL.createObjectURL(blob);
  objectUrls.value.push(url);
  return url;
}

function onFileChange(event) {
  parseError.value = '';
  parsed.value = null;
  revokeObjectUrls();

  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const raw = e.target?.result;
    if (typeof raw !== 'string') {
      parseError.value = t('pages.formatting.emlViewer.invalidEml');
      return;
    }
    const result = parseEml(raw);
    if (result.error) {
      parseError.value = result.error;
      return;
    }
    parsed.value = result;
  };
  reader.onerror = () => {
    parseError.value = t('pages.formatting.emlViewer.parseError');
  };
  reader.readAsText(file, 'utf-8');
}

const messagePartsOnly = computed(() => {
  if (!parsed.value?.parts) return [];
  return parsed.value.parts.filter((p) => !p.isAttachment);
});

const plainPart = computed(() =>
  messagePartsOnly.value.find((p) => (p.contentType || '').startsWith('text/plain')),
);
const htmlPart = computed(() =>
  messagePartsOnly.value.find((p) => (p.contentType || '').startsWith('text/html')),
);

const messageTabs = computed(() => {
  const tabs = [];
  if (plainPart.value) tabs.push('text/plain');
  if (htmlPart.value) tabs.push('text/html');
  return tabs;
});

const activeMessageTab = ref('text/plain');
watch(messageTabs, (tabs) => {
  if (tabs.length && !tabs.includes(activeMessageTab.value)) {
    activeMessageTab.value = tabs[0];
  }
}, { immediate: true });

const formatHtml = ref(true);

const allHeaderKeys = computed(() => {
  if (!parsed.value?.headers) return [];
  return Object.keys(parsed.value.headers);
});

/**
 * Strip/sanitize HTML for safe display: remove script, style, event handlers, javascript: links.
 * Runs only in browser (DOMParser).
 */
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  if (typeof DOMParser === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const remove = doc.querySelectorAll('script, style, iframe, object, embed, form, meta[http-equiv="refresh"], base');
    remove.forEach((el) => el.remove());
    const all = doc.querySelectorAll('*');
    all.forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const value = (attr.value || '').toLowerCase();
        if (
          attr.name.startsWith('on') ||
          (attr.name === 'href' &&
            (value.startsWith('javascript:') ||
              value.startsWith('data:') ||
              value.startsWith('vbscript:')))
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });
    const body = doc.body;
    return body ? body.innerHTML : doc.documentElement ? doc.documentElement.innerHTML : html;
  } catch {
    return html;
  }
}

onUnmounted(() => {
  revokeObjectUrls();
});

const { $toast } = useNuxtApp();
watch(parseError, (err) => {
  if (err) {
    $toast?.error?.(err, { position: 'bottom-center' });
  }
});
</script>

<template>
  <div>
    <h2 class="mb-2">
      {{ t('pages.formatting.emlViewer.heading') }}
    </h2>

    <VCard color="secondary" variant="elevated" class="mb-4">
      <VCardItem>
        <div>
          <div class="text-overline mb-2">
            {{ t('common.about') }}
          </div>
          <div class="text-h6 mb-1">
            {{ t('pages.formatting.emlViewer.descriptionText') }}
          </div>
          <div class="text-h6 mb-1">
            {{ t('pages.formatting.emlViewer.descriptionPrivacy') }}
          </div>
        </div>
      </VCardItem>
    </VCard>

    <VCard class="mb-4">
      <VCardText>
        <h3 class="mb-3">
          {{ t('pages.formatting.emlViewer.selectFile') }}
        </h3>
        <input type="file" accept=".eml,message/rfc822" class="w-100" @change="onFileChange">
      </VCardText>
    </VCard>

    <template v-if="!parsed && !parseError">
      <VCard>
        <VCardText>
          <span class="text-medium-emphasis">
            {{ t('pages.formatting.emlViewer.noFileSelected') }}
          </span>
        </VCardText>
      </VCard>
    </template>

    <template v-else-if="parseError">
      <VCard color="error" variant="tonal">
        <VCardText>
          {{ parseError }}
        </VCardText>
      </VCard>
    </template>

    <template v-else-if="parsed">
      <!-- 1. From, To, Cc -->
      <VCard class="mb-4">
        <VCardText>
          <dl class="eml-headers eml-from-to-cc">
            <template v-for="key in fromToCcKeys" :key="key">
              <template v-if="parsed.headers[key]">
                <dt>{{ key }}</dt>
                <dd>{{ parsed.headers[key] }}</dd>
              </template>
            </template>
          </dl>
        </VCardText>
      </VCard>

      <!-- 2. Nachrichtenteile als Reiter: text/plain, text/html -->
      <VCard v-if="messageTabs.length" class="mb-4">
        <VTabs v-model="activeMessageTab" density="compact" class="eml-message-tabs">
          <VTab v-for="tab in messageTabs" :key="tab" :value="tab">
            {{ tab }}
          </VTab>
        </VTabs>
        <VWindow v-model="activeMessageTab" class="eml-message-window">
          <VWindowItem value="text/plain">
            <VCardText v-if="plainPart">
              <pre class="eml-body-text">{{ plainPart.body || '' }}</pre>
            </VCardText>
          </VWindowItem>
          <VWindowItem value="text/html">
            <VCardText v-if="htmlPart">
              <div class="mb-4">
                <VCheckbox v-model="formatHtml" :label="t('pages.formatting.emlViewer.formatHtml')" density="compact"
                  hide-details />
                <span v-if="formatHtml" class="text-caption text-medium-emphasis">
                  {{ t('pages.formatting.emlViewer.formatHtmlNote') }}
                </span>
              </div>
              <iframe v-if="formatHtml" sandbox="allow-same-origin" title="HTML Nachricht" class="eml-body-iframe"
                :srcdoc="stripHtml(htmlPart.body || '')" />
              <pre v-else class="eml-body-text">{{ htmlPart.body || '' }}</pre>
            </VCardText>
          </VWindowItem>
        </VWindow>
      </VCard>

      <!-- Weitere Nachrichtenteile (andere MIME-Typen) -->
      <VCard
        v-for="(part, idx) in messagePartsOnly.filter(p => !p.contentType.startsWith('text/plain') && !p.contentType.startsWith('text/html'))"
        :key="idx" class="mb-4">
        <VCardTitle class="text-subtitle-1">
          {{ part.contentType }}
        </VCardTitle>
        <VCardText>
          <p class="text-medium-emphasis mb-2">
            {{ part.contentType }}
            <span v-if="part.size"> · {{ part.size }} B</span>
          </p>
          <a v-if="part.blob" :href="getAttachmentUrl(part.blob)" :download="part.filename || `part-${idx}`"
            class="v-btn v-btn-size-small v-btn-variant-elevated v-btn-color-primary">
            {{ t('pages.formatting.emlViewer.downloadAttachment') }}
          </a>
        </VCardText>
      </VCard>

      <!-- 3. Anhänge -->
      <VCard v-if="parsed.attachments?.length" class="mb-4">
        <VCardTitle>
          {{ t('pages.formatting.emlViewer.attachments') }} ({{ parsed.attachments.length }})
        </VCardTitle>
        <VCardText>
          <ul class="eml-attachments list-unstyled">
            <li v-for="(att, idx) in parsed.attachments" :key="idx" class="d-flex align-center gap-2 py-2">
              <span class="flex-grow-1 text-truncate" :title="att.filename">
                {{ att.filename }}
              </span>
              <span class="text-caption text-medium-emphasis">
                {{ att.contentType }} · {{ att.size }} B
              </span>
              <a :href="getAttachmentUrl(att.blob)" :download="att.filename"
                class="v-btn v-btn-size-small v-btn-variant-elevated v-btn-color-primary">
                {{ t('pages.formatting.emlViewer.downloadAttachment') }}
              </a>
            </li>
          </ul>
        </VCardText>
      </VCard>

      <!-- 4. Alle Kopfzeilen (collapsed) -->
      <VCard class="mb-4">
        <VExpansionPanels>
          <VExpansionPanel>
            <VExpansionPanelTitle>
              {{ t('pages.formatting.emlViewer.allHeaders') }}
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <dl class="eml-headers">
                <template v-for="key in allHeaderKeys" :key="key">
                  <dt>{{ key }}</dt>
                  <dd>{{ parsed.headers[key] }}</dd>
                </template>
              </dl>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCard>
    </template>
  </div>
</template>

<style scoped>
.eml-headers {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
}

.eml-headers dt {
  font-weight: 600;
  margin: 0;
}

.eml-headers dd {
  margin: 0;
  word-break: break-word;
}

.eml-body-text {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60vh;
  overflow: auto;
  margin: 0;
  padding: 0.5rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  font-size: 0.9rem;
}

.eml-body-iframe {
  width: 100%;
  min-height: 300px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.eml-message-tabs {
  flex-shrink: 0;
}

.eml-message-window {
  overflow: auto;
}
</style>
