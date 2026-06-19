<script setup>
/**
 * PlotDeleteDialog component.
 * Confirmation overlay for deleting a plot. As a safety step the user must
 * retype the exact plot name before the destructive action is enabled. Ported
 * from the OS Angular `PlotDeleteDialog`.
 *
 * @component
 */
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  /** Name of the plot to delete, used to gate the confirm button. */
  plotName: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['cancel', 'confirm']);

const typedName = ref('');

const canDelete = computed(() => typedName.value.trim() === props.plotName.trim());

const confirm = () => {
  if (canDelete.value) emit('confirm');
};
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('cancel')">
    <div class="delete-dialog" role="dialog" aria-modal="true">
      <div class="dialog-head">
        <span class="warn-icon"><i class="pi pi-exclamation-triangle"></i></span>
        <h2>{{ t('plotDetail.delete.title') }}</h2>
      </div>

      <p class="dialog-text">{{ t('plotDetail.delete.body', { name: plotName }) }}</p>

      <label class="field-label">{{ t('plotDetail.delete.confirmLabel') }}</label>
      <input
          v-model="typedName"
          class="field"
          :placeholder="plotName"
          autocomplete="off"
          @keyup.enter="confirm"
      />

      <div class="dialog-actions">
        <button type="button" class="cancel-button" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </button>
        <button type="button" class="delete-button" :disabled="!canDelete" @click="confirm">
          <i class="pi pi-trash"></i> {{ t('plotDetail.delete.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(31, 37, 35, 0.45);
}

.delete-dialog {
  font-family: 'Poppins', sans-serif;
  width: 100%;
  max-width: 460px;
  padding: 24px 26px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(31, 37, 35, 0.25);
}

.dialog-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.warn-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fdecec;
  color: #ff5c5c;
}

.warn-icon i {
  font-size: 20px;
}

.dialog-head h2 {
  margin: 0;
  font-weight: 600;
  font-size: 18px;
  color: #1f2523;
}

.dialog-text {
  margin: 14px 0 18px;
  font-weight: 400;
  font-size: 14px;
  color: #4f4f4f;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
  color: #1f2523;
}

.field {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #e0dbd2;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #4f4f4f;
  outline: none;
}

.field:focus {
  border-color: #2e4a3a;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.cancel-button,
.delete-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #2e4a3a;
  background: #ffffff;
  color: #2e4a3a;
}

.delete-button {
  border: none;
  background: #ff5c5c;
  color: #ffffff;
}

.delete-button i {
  font-size: 16px;
}

.delete-button:disabled {
  background: #f0d6d6;
  cursor: not-allowed;
}
</style>
