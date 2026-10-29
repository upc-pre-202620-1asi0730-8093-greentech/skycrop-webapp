
import {createRouter, createWebHistory} from 'vue-router';

const pendingSection = () => import('./shared/presentation/views/pending-section.vue');

const routes = [
  {path: '/', redirect: '/plots'},
  {path: '/home', name: 'home', component: pendingSection, props: {titleKey: 'navigation.home'}},
  {path: '/profiles', name: 'profile', component: pendingSection, props: {titleKey: 'navigation.profile'}},
  {path: '/drones', name: 'drones', component: () => import('./drones/presentation/views/drone-list.vue')},
  {path: '/drones/new', name: 'drone-registration', component: () => import('./drones/presentation/views/drone-registration.vue')},
  {path: '/drones/:id', name: 'drone-details', component: () => import('./drones/presentation/views/drone-details.vue')},
  {path: '/diagnoses', name: 'diagnoses', component: () => import('./diagnoses/presentation/views/diagnoses-list.vue')},
  {path: '/diagnoses/:id', name: 'diagnosis-details', component: () => import('./diagnoses/presentation/views/diagnosis-details.vue')},
  {path: '/reports', name: 'reports', component: () => import('./reports/presentation/views/report-list.vue')},
  {path: '/reports/:id', name: 'report-details', component: () => import('./reports/presentation/views/report-details.vue')},
  {path: '/settings', name: 'settings', component: pendingSection, props: {titleKey: 'navigation.settings'}},

  {path: '/plots', name: 'plots', component: () => import('./plots/presentation/views/plot-list.vue')},
  {path: '/plots/new', name: 'plot-registration', component: () => import('./plots/presentation/views/plot-registration.vue')},
  {path: '/plots/:id', name: 'plot-details', component: () => import('./plots/presentation/views/plot-details.vue')},

  {path: '/plots/:id/crops/new', name: 'crop-registration', component: () => import('./crops/presentation/components/crop-form.vue')},
  {path: '/plots/:id/crops', name: 'crop-list', component: () => import('./crops/presentation/views/crop-list.vue')},
  {path: '/plots/:id/crops/:cropId/edit', name: 'crop-edit', component: () => import('./crops/presentation/components/crop-form.vue')},
  {path: '/plots/:id/crops/:cropId', name: 'crop-details', component: () => import('./crops/presentation/views/crop-details.vue')}
];

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});
