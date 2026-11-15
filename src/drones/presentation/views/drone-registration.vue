<script setup>
import {reactive, computed} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useDronesStore} from '../../application/drones.store.js';
const {t} = useI18n(),
  router = useRouter(),
  store = useDronesStore();
const form = reactive({
  name: '',
  model: '',
  serialNumber: '',
  camera: '',
  autonomyMinutes: 30,
  battery: 100,
  imageUrl: '',
});
const valid = computed(
  () =>
    [form.name, form.model, form.serialNumber, form.camera].every((value) => value.trim()) &&
    Number(form.autonomyMinutes) > 0 &&
    Number(form.battery) >= 0 &&
    Number(form.battery) <= 100,
);
async function submit() {
  if (!valid.value) return;
  const drone = await store.register({
    ...form,
    autonomyMinutes: Number(form.autonomyMinutes),
    battery: Number(form.battery),
  });
  if (drone) router.push(`/drones/${drone.id}`);
}
</script>
<template>
  <section class="plots-page drones-page">
    <router-link class="action-link back-link" to="/drones">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      <span>{{ t('drones.back') }}</span>
    </router-link>    <h1>{{ t('drones.register') }}</h1>
    <form class="drone-registration" @submit.prevent="submit">
      <fieldset class="plot-card">
        <legend>{{ t('plots.basicInformation') }}</legend>
        <div
          v-for="field in ['name', 'model', 'serialNumber', 'camera']"
          :key="field"
          class="form-field"
        >
          <label :for="`drone-${field}`">{{ t(`drones.${field}`) }}</label
          ><pv-input-text
            :id="`drone-${field}`"
            v-model="form[field]"
            required
            maxlength="120"
            :disabled="store.saving"
          />
        </div>
        <div class="coordinate-fields">
          <div class="form-field">
            <label for="drone-autonomy">{{ t('drones.autonomy') }} (min)</label
            ><pv-input-text
              id="drone-autonomy"
              v-model="form.autonomyMinutes"
              type="number"
              min="1"
              step="1"
              required
              :disabled="store.saving"
            />
          </div>
          <div class="form-field">
            <label for="drone-battery">{{ t('drones.battery') }} (%)</label
            ><pv-input-text
              id="drone-battery"
              v-model="form.battery"
              type="number"
              min="0"
              max="100"
              required
              :disabled="store.saving"
            />
          </div>
        </div>
        <div class="form-field">
          <label for="drone-image">{{ t('plots.imageUrl') }}</label
          ><pv-input-text
            id="drone-image"
            v-model="form.imageUrl"
            type="url"
            :disabled="store.saving"
          />
        </div>
      </fieldset>
      <p v-if="store.error" role="alert" class="error-message">{{ t(store.error) }}</p>
      <div class="form-actions flex-wrap">
        <router-link to="/drones">{{ t('plots.cancel') }}</router-link
        ><pv-button
          type="submit"
          :label="t('drones.register')"
          :loading="store.saving"
          :disabled="!valid || store.saving"
        />
      </div>
    </form>
  </section>
</template>
