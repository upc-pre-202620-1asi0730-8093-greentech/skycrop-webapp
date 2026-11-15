<script setup>
import {useI18n} from 'vue-i18n';
const {t} = useI18n();

import {storeToRefs} from "pinia";

import PlotImage from "../../../plots/presentation/components/plot-image.vue";
import {usePlotsStore} from "../../application/plots.store.js";
import {onMounted} from "vue";

const plotsStore = usePlotsStore()
const {plots, loading, error, summaries, summaryError} = storeToRefs(plotsStore);

onMounted(() => plotsStore.fetchPlots());

</script>


<template>
  <p v-if="loading" role="status">{{ t('plots.loading') }}</p>

  <div v-else-if="error" role="alert" class="error-message">
    <p>{{ t(error) }}</p>
    <pv-button :label="t('plots.retry')" @click="plotsStore.fetchPlots()" />
  </div>

  <template v-else>
    <p v-if="summaryError" class="error-message" role="status">
      {{ t(summaryError) }}
    </p>
    <p v-if="!plots.length" class="empty-state">
      {{ t('plots.empty') }}
    </p>

    <div v-else class="plot-slider">
      <article
          v-for="plot in plots"
          :key="plot.id"
          class="plot-card plot-summary"
      >
        <PlotImage :src="plot.imageUrl" :name="plot.name" />

        <div class="plot-summary-content">
          <h2>{{ plot.name }}</h2>
          <div class="plot-summary-details">
            <div class="plot-summary-information">
              <p>
                {{ t('plots.cropType') }}:
                {{ summaries[plot.id]?.crops || plot.cropType || t('plots.notAvailable') }}
              </p>
              <p>
                {{ t('plots.activeAlerts') }}:
                {{ summaries[plot.id]?.activeAlerts ?? t('plots.notAvailable') }}
              </p>
            </div>
            <div class="plot-summary-actions">
              <router-link
                  :to="`/plots/${plot.id}`"
                  :aria-label="t('plots.detailsLink', {name: plot.name})"
              >
                {{ t('plots.details') }}
              </router-link>
            </div>
          </div>
        </div>

      </article>
    </div>
  </template>
</template>

<style scoped>

</style>