const reportList = () => import('./views/report-list.vue')
const reportDetails = () => import('./views/report-details.vue')

const reportsRoutes = [
    {path: '',      name: 'report-list',        component: reportList},
    {path: ':id',  name: 'report-details', component: reportDetails},
]

export default reportsRoutes;