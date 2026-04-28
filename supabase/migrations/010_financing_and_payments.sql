-- Migration 010: Financing, bulk payments, payroll, recipients
-- Run after 009_referrals.sql

-- ── Financing ─────────────────────────────────────────────────────────

create table if not exists financing_applications (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid references businesses(id) on delete cascade,
  amount_requested  integer not null,
  amount_approved   integer,
  purpose           text not null,
  status            text not null default 'pending'
                    check (status in ('pending','under_review','approved','rejected','disbursed','repaid')),
  monthly_revenue_avg integer,
  repayment_rate    numeric(4,2),
  disbursed_at      timestamptz,
  repaid_at         timestamptz,
  rejection_reason  text,
  reviewer_notes    text,
  created_at        timestamptz not null default now()
);

create table if not exists financing_repayments (
  id                uuid primary key default uuid_generate_v4(),
  application_id    uuid not null references financing_applications(id) on delete cascade,
  transaction_id    uuid references transactions(id),
  amount            integer not null,
  withheld_at       timestamptz not null default now()
);

alter table financing_applications enable row level security;
alter table financing_repayments   enable row level security;

create policy "financing_own_business" on financing_applications
  for all using (
    business_id in (select business_id from profiles where id = auth.uid())
  );

-- Repayments visible to business members only via join
create policy "financing_repayments_own" on financing_repayments
  for all using (
    application_id in (
      select id from financing_applications
      where business_id in (select business_id from profiles where id = auth.uid())
    )
  );

create index if not exists idx_financing_business_status on financing_applications (business_id, status);
create index if not exists idx_financing_repayments_app on financing_repayments (application_id);

-- Remaining balance helper column (maintained by triggers)
alter table financing_applications
  add column if not exists amount_remaining integer;

-- Track repayment amount withheld on each transaction
alter table transactions
  add column if not exists repayment_withheld integer;

-- ── Bulk Supplier Payments ────────────────────────────────────────────

create table if not exists payment_batches (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  total_amount  integer not null default 0,
  status        text not null default 'draft'
                check (status in ('draft','scheduled','processing','completed','failed')),
  scheduled_for timestamptz,
  processed_at  timestamptz,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create table if not exists batch_payments (
  id             uuid primary key default uuid_generate_v4(),
  batch_id       uuid not null references payment_batches(id) on delete cascade,
  recipient_name text not null,
  sinpe_numero   text not null,
  amount         integer not null,
  concept        text,
  status         text not null default 'pending'
                 check (status in ('pending','sent','failed')),
  sent_at        timestamptz,
  error          text
);

create table if not exists recipients (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  nombre        text not null,
  sinpe_numero  text not null,
  categoria     text check (categoria in ('proveedor','empleado','contratista','otro')),
  notas         text,
  created_at    timestamptz not null default now(),
  unique(business_id, sinpe_numero)
);

alter table payment_batches enable row level security;
alter table batch_payments  enable row level security;
alter table recipients      enable row level security;

create policy "batches_own_business" on payment_batches
  for all using (business_id in (select business_id from profiles where id = auth.uid()));

create policy "batch_payments_own" on batch_payments
  for all using (
    batch_id in (
      select id from payment_batches
      where business_id in (select business_id from profiles where id = auth.uid())
    )
  );

create policy "recipients_own_business" on recipients
  for all using (business_id in (select business_id from profiles where id = auth.uid()));

create index if not exists idx_batches_business on payment_batches (business_id, created_at desc);
create index if not exists idx_batch_payments_batch on batch_payments (batch_id);
create index if not exists idx_recipients_business on recipients (business_id);

-- ── Payroll ───────────────────────────────────────────────────────────

create table if not exists payroll_employees (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  location_id   uuid,  -- FK added after locations table (migration 012)
  nombre        text not null,
  sinpe_numero  text not null,
  salario_bruto integer not null,
  tipo          text not null default 'planilla'
                check (tipo in ('planilla','freelance','temporal')),
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists payroll_runs (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  location_id   uuid,
  periodo       text not null,
  frecuencia    text not null check (frecuencia in ('semanal','quincenal','mensual')),
  total_bruto   integer not null default 0,
  total_neto    integer not null default 0,
  status        text not null default 'draft'
                check (status in ('draft','processing','completed','failed')),
  created_at    timestamptz not null default now()
);

create table if not exists payroll_payments (
  id            uuid primary key default uuid_generate_v4(),
  run_id        uuid not null references payroll_runs(id) on delete cascade,
  employee_id   uuid not null references payroll_employees(id),
  monto_bruto   integer not null,
  deducciones   integer not null default 0,
  monto_neto    integer not null,
  status        text not null default 'pendiente'
                check (status in ('pendiente','enviado','fallido'))
);

alter table payroll_employees enable row level security;
alter table payroll_runs      enable row level security;
alter table payroll_payments  enable row level security;

create policy "payroll_employees_own" on payroll_employees
  for all using (business_id in (select business_id from profiles where id = auth.uid()));

create policy "payroll_runs_own" on payroll_runs
  for all using (business_id in (select business_id from profiles where id = auth.uid()));

create policy "payroll_payments_own" on payroll_payments
  for all using (
    run_id in (
      select id from payroll_runs
      where business_id in (select business_id from profiles where id = auth.uid())
    )
  );

create index if not exists idx_payroll_employees_business on payroll_employees (business_id);
create index if not exists idx_payroll_runs_business on payroll_runs (business_id, created_at desc);
create index if not exists idx_payroll_payments_run on payroll_payments (run_id);
