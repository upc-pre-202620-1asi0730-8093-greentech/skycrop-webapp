const droneList = () => import('./views/drone-list.vue')
const droneRegistration = () => import('./views/drone-registration.vue')
const droneDetails = () => import('./views/drone-details.vue')

const dronesRoutes = [
    {path: '', name: 'drone-list', component: droneList},
    {path: 'new', name: 'drone-registration', component: droneRegistration},
    {path: ':id', name: 'drone-details', component: droneDetails},
]

export default dronesRoutes;