import { createRouter, createWebHistory } from 'vue-router'
import TheWelcome from '../components/Bienvenido.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'bienvenido',
      component: TheWelcome
    },
    {
      path: '/antonio-banderas',
      name: 'antonio-banderas',
      component: () => import('../components/VistaCategoria.vue')
    },
    {
      path: '/arabes-miniaturas',
      name: 'arabes-miniaturas',
      component: () => import('../components/ArabesMiniaturas.vue')
    },
    {
      path: '/originales-outlet',
      name: 'originales-outlet',
      component: () => import('../components/OriginalesOutlet.vue')
    },
    {
      path: '/tubos-arabes',
      name: 'tubos-arabes',
      component: () => import('../components/TubosArabes.vue')
    },
    {
      path: '/arabes-g5',
      name: 'arabes-g5',
      component: () => import('../components/ArabesG5.vue')
    },
    {
      path: '/gestion',
      name: 'gestion',
      component: () => import('../components/GestionPerfumes.vue')
    },
    {
      path: '/arabes-originales',
      name: 'arabes-originales',
      component: () => import('../components/ArabesOriginales.vue')
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }
  }
})

export default router