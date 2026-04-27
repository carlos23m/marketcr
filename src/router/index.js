import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/create-link',
    name: 'CreateLink',
    component: () => import('@/views/CreateLinkView.vue'),
  },
  {
    path: '/payment-links',
    name: 'PaymentLinks',
    component: () => import('@/views/PaymentLinksView.vue'),
  },
  {
    path: '/links/:id',
    name: 'LinkDetail',
    component: () => import('@/views/LinkDetailView.vue'),
  },
  {
    path: '/transacciones',
    name: 'Transactions',
    component: () => import('@/views/TransactionsView.vue'),
  },
  {
    path: '/sms-import',
    name: 'SmsImport',
    component: () => import('@/views/SmsImportView.vue'),
  },
  {
    path: '/configuracion',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!auth.isSetup && to.name !== 'Onboarding') {
    return { name: 'Onboarding' }
  }
  if (auth.isSetup && to.name === 'Onboarding') {
    return { name: 'Dashboard' }
  }
})

export default router
