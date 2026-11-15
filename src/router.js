import {createRouter, createWebHistory} from 'vue-router';
import home from './shared/presentation/views/home.vue';
import reportsRoutes from './reports/presentation/reports-routes.js';
import plotsRoutes from './plots/presentation/plots-routes.js';
import cropsRoutes from './crops/presentation/crops-routes.js';
import dronesRoutes from './drones/presentation/drones-routes.js';
import diagnosesRoutes from './diagnoses/presentation/diagnoses-routes.js';
import {useSessionStore} from './iam/application/session.store.js';
import {sessionRedirect} from './iam/domain/model/navigation-policy.js';

const access = () => import('./iam/presentation/views/access.vue');
const subscriptions = () => import('./subscriptions/presentation/views/subscriptions.vue');
const plotMembers = () => import('./plots/presentation/views/plot-members.vue');

export const routes = [
  {path: '/', redirect: '/home'},
  ...['login', 'register', 'recover-access', 'verify-access'].map(name => ({path: `/${name}`, name, component: access, meta: {public: true, guestOnly: true}})),
  {path: '/home', name: 'home', component: home},
  {path: '/profiles', alias: '/profile', name: 'profile', component: () => import('./profiles/presentation/views/profile.vue')},
  {path: '/settings', name: 'settings', component: () => import('./profiles/presentation/views/settings.vue')},
  {path: '/notifications', name: 'notifications', component: () => import('./notifications/presentation/views/notifications.vue')},
  {path: '/subscriptions', name: 'subscriptions', component: subscriptions},
  {path: '/subscriptions/checkout/:planId', name: 'subscription-checkout', component: subscriptions},
  {path: '/subscriptions/payments/:paymentId', name: 'payment-result', component: subscriptions},
  {path: '/plot-members', name: 'plot-members', component: plotMembers},
  {path: '/plots/:id/members', name: 'plot-members-detail', component: plotMembers},
  {path: '/drones', name: 'drones', redirect: {name: 'drone-list'}, children: dronesRoutes},
  {path: '/diagnoses', name: 'diagnoses', redirect: {name: 'diagnoses-list'}, children: diagnosesRoutes},
  {path: '/reports', name: 'reports', redirect: {name: 'report-list'}, children: reportsRoutes},
  {path: '/plots', name: 'plots', redirect: {name: 'plot-list'}, children: plotsRoutes},
  {path: '/plots/:id/crops', name: 'crops', redirect: to => ({name: 'crop-list', params: {id: to.params.id}}), children: cropsRoutes},
  {path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./shared/presentation/views/page-not-found.vue'), meta: {public: true}},
];

const router = createRouter({history: createWebHistory(import.meta.env.BASE_URL), routes});
router.beforeEach(to => sessionRedirect(to, useSessionStore().isSignedIn()));
export default router;
