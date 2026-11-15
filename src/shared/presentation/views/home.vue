<script setup>
import {useI18n} from 'vue-i18n';
import PlotsSlider from "../../../plots/presentation/components/plots-slider.vue";
import DiagnosesGrid from "../../../diagnoses/presentation/components/diagnoses-grid.vue";
import {useSessionStore} from '../../../iam/application/session.store.js';
import {useReportsStore} from '../../../reports/application/reports.store.js';
import {computed, onMounted} from 'vue';
const {t} = useI18n();
const session = useSessionStore(), reports = useReportsStore();
onMounted(() => reports.load());
const latestReportPath = computed(() => reports.reports.length ? `/reports/${reports.reports[0].id}` : '/reports');

const actions = computed(() => [
  {label: 'home.quickActions.registerDrone', to: '/drones/new'},
  {label: 'home.quickActions.seeReports', to: latestReportPath.value},
  {label: 'home.quickActions.inviteMembers', to: '/plot-members'},
])

</script>




<template>

  <section>
    <h1>{{t('home.welcome', {user: session.user?.name ?? ''})}}</h1>
  </section>


  <section>
    <div>
      <h2>{{t('home.checkPlots')}}</h2>
      <div>
        <plots-slider/>
      </div>
    </div>
  </section>


  <section>
    <div>
      <h2>{{t('home.quickActions.heading')}}</h2>
      <div>
        <article class="quick-action-slider">
          <router-link v-for="action in actions" :key="action.label" :to="action.to" class="quick-action">
            {{ t(`${action.label}`) }}
          </router-link>
        </article>
      </div>
    </div>
  </section>


  <section>
    <div>
      <h2>{{t('home.recentDiagnoses')}}</h2>
      <div>
        <diagnoses-grid/>
      </div>
    </div>
  </section>
</template>



<style scoped>

</style>