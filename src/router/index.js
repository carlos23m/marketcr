import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const routes = [
  { path: '/', redirect: '/dashboard' },

  // Auth (guest only)
  { path: '/login',          name: 'Login',          component: () => import('@/views/auth/LoginView.vue'),         meta: { guestOnly: true } },
  { path: '/register',       name: 'Register',       component: () => import('@/views/auth/RegisterView.vue'),      meta: { guestOnly: true } },
  { path: '/invite/accept',  name: 'InviteAccept',   component: () => import('@/views/auth/InviteAcceptView.vue') },
  { path: '/reset-password', name: 'ResetPassword',  component: () => import('@/views/auth/ResetPasswordView.vue'), meta: { public: true } },

  // Onboarding
  { path: '/onboarding', name: 'Onboarding', component: () => import('@/views/auth/OnboardingView.vue'), meta: { requiresAuth: true } },

  // Public
  { path: '/p/:id', name: 'Pay', component: () => import('@/views/public/PayView.vue'), meta: { public: true } },

  // Referral entry point (public)
  { path: '/r/:code', name: 'ReferralLanding', component: () => import('@/views/auth/RegisterView.vue'), meta: { guestOnly: true } },

  // App (requires auth + business)
  { path: '/dashboard',       name: 'Dashboard',      component: () => import('@/views/DashboardView.vue'),       meta: { requiresBusiness: true } },
  { path: '/create-link',     name: 'CreateLink',     component: () => import('@/views/CreateLinkView.vue'),      meta: { requiresBusiness: true } },
  { path: '/payment-links',   name: 'PaymentLinks',   component: () => import('@/views/PaymentLinksView.vue'),    meta: { requiresBusiness: true } },
  { path: '/links/:id',       name: 'LinkDetail',     component: () => import('@/views/LinkDetailView.vue'),      meta: { requiresBusiness: true } },
  { path: '/transacciones',   name: 'Transactions',   component: () => import('@/views/TransactionsView.vue'),    meta: { requiresBusiness: true } },
  { path: '/sms-import',      name: 'SmsImport',      component: () => import('@/views/SmsImportView.vue'),       meta: { requiresBusiness: true } },
  { path: '/facturas',        name: 'Invoices',       component: () => import('@/views/InvoicesView.vue'),        meta: { requiresBusiness: true } },
  { path: '/facturas/:id',    name: 'InvoiceDetail',  component: () => import('@/views/InvoiceDetailView.vue'),   meta: { requiresBusiness: true } },
  { path: '/configuracion',   name: 'Settings',       component: () => import('@/views/SettingsView.vue'),        meta: { requiresBusiness: true } },

  // M3 new routes
  { path: '/analitica',                    name: 'Analytics',   component: () => import('@/views/AnalyticsView.vue'),    meta: { requiresBusiness: true } },
  { path: '/pos',                          name: 'Pos',         component: () => import('@/views/PosView.vue'),          meta: { requiresBusiness: true } },
  { path: '/developers',                   name: 'ApiDocs',     component: () => import('@/views/ApiDocsView.vue'),      meta: { requiresBusiness: true } },
  { path: '/developers/plugins',           name: 'Plugins',     component: () => import('@/views/PluginsView.vue'),      meta: { requiresBusiness: true } },
  { path: '/configuracion/facturacion',    name: 'Billing',     component: () => import('@/views/BillingView.vue'),      meta: { requiresBusiness: true } },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.loading) {
    await new Promise(resolve => {
      const stop = setInterval(() => {
        if (!auth.loading) { clearInterval(stop); resolve() }
      }, 50)
    })
  }

  if (to.meta.public) return true

  if (to.meta.guestOnly) {
    if (auth.isLoggedIn) return { name: 'Dashboard' }
    return true
  }

  if (to.meta.requiresAuth || to.meta.requiresBusiness) {
    if (!auth.isLoggedIn) return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresBusiness) {
    if (!auth.isSetup && to.name !== 'Onboarding') return { name: 'Onboarding' }
  }

  if (to.name === 'Onboarding' && auth.isSetup) return { name: 'Dashboard' }

  return true
})

export default router
