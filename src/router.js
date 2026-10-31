
import {createRouter, createWebHistory} from 'vue-router';
import home from "./shared/presentation/views/home.vue";

import reportsRoutes from "./reports/presentation/reports-routes.js";
import plotsRoutes from "./plots/presentation/plots-routes.js";
import cropsRoutes from "./crops/presentation/crops-routes.js";
import dronesRoutes from "./drones/presentation/drones-routes.js";
import diagnosesRoutes from "./diagnoses/presentation/diagnoses-routes.js";

const pendingSection = () => import('./shared/presentation/views/pending-section.vue');

const routes = [
  {path: '/', redirect: '/plots'},
  {path: '/home', name: 'home', component: home},
  {path: '/profiles', name: 'profile', component: pendingSection, props: {titleKey: 'navigation.profile'}},
  {path: '/settings', name: 'settings', component: pendingSection, props: {titleKey: 'navigation.settings'}},

  {path: '/drones', name: 'drones', redirect: '/drones', children: dronesRoutes},
  {path: '/diagnoses', name: 'diagnoses', redirect: '/diagnoses', children: diagnosesRoutes},
  {path: '/reports', name: 'reports', redirect:'/reports', children: reportsRoutes},
  {path: '/plots', name: 'plots', redirect: '/plots', children: plotsRoutes},
  {path: '/plots/:id/crops', name: 'crops', redirect: '/plots:id/crops', children: cropsRoutes}

];

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});
