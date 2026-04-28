import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const PLAN_ORDER = ['starter', 'pro', 'business']

function planGte(plan, minimum) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(minimum)
}

export function usePlanLimits() {
  const auth = useAuthStore()

  const plan = computed(() => {
    const biz = auth.business
    if (!biz) return 'starter'
    const now = new Date()
    if (biz.trial_end && new Date(biz.trial_end) > now) return biz.plan || 'pro'
    if (biz.plan_period_end && new Date(biz.plan_period_end) > now) return biz.plan || 'starter'
    return 'starter'
  })

  const trialDaysLeft = computed(() => {
    const biz = auth.business
    if (!biz?.trial_end) return 0
    const diff = new Date(biz.trial_end) - new Date()
    return Math.max(0, Math.ceil(diff / 86_400_000))
  })

  const isTrialing = computed(() => {
    const biz = auth.business
    if (!biz?.trial_end) return false
    return new Date(biz.trial_end) > new Date()
  })

  const limits = computed(() => ({
    starter:  { links: 50,   txns: 100,  invoices: 20,  users: 1,  webhooks: 0,    api_rate: 100    },
    pro:      { links: null, txns: null, invoices: null, users: 3,  webhooks: 3,    api_rate: 2000   },
    business: { links: null, txns: null, invoices: null, users: 10, webhooks: null, api_rate: 10000  },
  }[plan.value]))

  const canCreateLink      = computed(() => limits.value.links === null)
  const canAccessApi       = computed(() => planGte(plan.value, 'pro'))
  const canUseAutoSms      = computed(() => planGte(plan.value, 'pro'))
  const canRemoveBranding  = computed(() => planGte(plan.value, 'pro'))
  const canUseCardPayments = computed(() => planGte(plan.value, 'pro'))
  const canUsePosMode      = computed(() => planGte(plan.value, 'pro'))
  const canUseAnalytics    = computed(() => planGte(plan.value, 'pro'))

  function canInviteUser(currentCount) {
    const max = limits.value.users
    return max === null || currentCount < max
  }

  return {
    plan,
    trialDaysLeft,
    isTrialing,
    limits,
    planGte: (min) => planGte(plan.value, min),
    canCreateLink,
    canAccessApi,
    canUseAutoSms,
    canRemoveBranding,
    canUseCardPayments,
    canUsePosMode,
    canUseAnalytics,
    canInviteUser,
  }
}
