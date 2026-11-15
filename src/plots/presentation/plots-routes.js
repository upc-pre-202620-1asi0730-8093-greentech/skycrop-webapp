const plotDetails = () =>  import('./views/plot-details.vue')
const plotList = () =>  import('./views/plot-list.vue')
const plotRegistration = () =>  import('./views/plot-registration.vue')

const plotsRoutes = [
    {path: '',      name: 'plot-list',     component: plotList},
    {path: 'new',   name: 'plot-registration', component: plotRegistration},
    {path: ':id',      name: 'plot-details',     component: plotDetails},
]

export default plotsRoutes;