-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Add invite_sent_at column for tracking sent invitations
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

alter table guests add column if not exists invite_sent_at timestamptz;
