-- Migration 008: Twilio number + POS quick items
-- Run in Supabase SQL editor after 007_billing.sql

alter table businesses
  add column if not exists twilio_number text unique,
  add column if not exists quick_items   jsonb not null default '[]'::jsonb;
