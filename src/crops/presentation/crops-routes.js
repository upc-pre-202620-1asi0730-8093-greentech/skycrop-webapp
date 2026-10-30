const cropForm = () => import('./views/crop-form.vue')
const cropList = () => import('./views/crop-list.vue')
const cropDetails = () => import('./views/crop-details.vue')

const cropsRoutes = [
    {path: '', name: 'crop-list', component: cropList},
    {path: 'new', name: 'crop-registration', component: cropForm},
    {path: ':cropId', name: 'crop-details', component: cropDetails},
    {path: ':cropId/edit', name: 'crop-edit', component: cropForm}
]

export default cropsRoutes;