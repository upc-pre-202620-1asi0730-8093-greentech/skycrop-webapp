const diagnosesList = () => import('./views/diagnoses-list.vue');
const diagnosisDetails = () => import('./views/diagnosis-details.vue');

const diagnosesRoutes = [
    {path: '', name: 'diagnoses-list', component: diagnosesList},
    {path: ':id', name: 'diagnosis-details', component: diagnosisDetails},
]

export default diagnosesRoutes;