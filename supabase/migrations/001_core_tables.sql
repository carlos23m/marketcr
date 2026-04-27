-- Migration 001: core tables
-- Run in Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Business accounts
create table if not exists businesses (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  tipo            text not null,
  sinpe_numero    text not null,
  cedula_juridica text,
  whatsapp        text,
  email           text,
  plan            text not null default 'free',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- User profiles (linked to Supabase Auth)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete set null,
  nombre      text not null,
  email       text not null,
  rol         text not null default 'dueno',
  created_at  timestamptz default now()
);

-- Payment links
create table if not exists payment_links (
  id            text primary key,
  business_id   uuid references businesses(id) on delete cascade,
  created_by    uuid references profiles(id) on delete set null,
  descripcion   text not null,
  monto         integer not null,
  cliente       text,
  vencimiento   timestamptz,
  notas         text,
  estado        text not null default 'activo'
                  check (estado in ('activo','pagado','vencido','borrador')),
  pagado_en     timestamptz,
  created_at    timestamptz default now()
);

-- Transactions (confirmed payments)
create table if not exists transactions (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid references businesses(id) on delete cascade,
  link_id           text references payment_links(id) on delete set null,
  monto             integer not null,
  nombre_remitente  text not null,
  banco             text not null,
  telefono          text,
  referencia        text,
  fecha             timestamptz not null,
  raw_sms           text,
  confianza         integer default 100,
  parse_method      text not null default 'manual'
                      check (parse_method in ('sms','manual','link')),
  invoice_id        uuid,
  created_at        timestamptz default now()
);

-- Electronic invoices (Hacienda FE v4.4)
create table if not exists invoices (
  id                  uuid primary key default uuid_generate_v4(),
  business_id         uuid references businesses(id) on delete cascade,
  transaction_id      uuid references transactions(id) on delete set null,
  numero_consecutivo  text not null,
  clave               text not null,
  estado              text default 'borrador'
                        check (estado in ('borrador','enviada','aceptada','rechazada')),
  xml_firmado         text,
  pdf_url             text,
  hacienda_response   jsonb,
  fecha_emision       timestamptz default now(),
  created_at          timestamptz default now()
);

-- Team invitations
create table if not exists invitations (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  email       text not null,
  rol         text not null default 'cajero',
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  accepted    boolean default false,
  expires_at  timestamptz default (now() + interval '7 days'),
  created_at  timestamptz default now()
);

-- Notification logs (daily summaries)
create table if not exists notification_logs (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  tipo        text not null,
  canal       text not null,
  payload     jsonb,
  enviado     boolean default false,
  created_at  timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_payment_links_business_estado
  on payment_links (business_id, estado);
create index if not exists idx_transactions_business_fecha
  on transactions (business_id, fecha desc);
create index if not exists idx_invoices_business_fecha
  on invoices (business_id, fecha_emision desc);
create index if not exists idx_profiles_business
  on profiles (business_id);
