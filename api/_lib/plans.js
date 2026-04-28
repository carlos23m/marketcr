export const PLAN_LIMITS = {
  starter:  { links_per_month: 50,  txns_per_month: 100, invoices_per_month: 20, users: 1,  api_rate: 100,    webhooks: 0 },
  pro:      { links_per_month: null, txns_per_month: null, invoices_per_month: null, users: 3,  api_rate: 2000,   webhooks: 3 },
  business: { links_per_month: null, txns_per_month: null, invoices_per_month: null, users: 10, api_rate: 10000,  webhooks: null },
}

const VALID_PLANS = new Set(Object.keys(PLAN_LIMITS))

function normalizePlan(plan) {
  return VALID_PLANS.has(plan) ? plan : 'starter'
}

export function effectivePlan(business) {
  const now = new Date()
  if (business.trial_end && new Date(business.trial_end) > now) return normalizePlan(business.plan)
  if (business.plan_period_end && new Date(business.plan_period_end) > now) return normalizePlan(business.plan)
  return 'starter'
}

export function planGte(plan, minimum) {
  const order = ['starter', 'pro', 'business']
  return order.indexOf(plan) >= order.indexOf(minimum)
}
