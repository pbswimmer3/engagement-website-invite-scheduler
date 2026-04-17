# Engagement Invite Sender

A simple admin app to send email invitations to guests for Aanya & Prad's engagement party. Connects to the same Supabase database as the engagement website, auto-generates personalized HTML emails per invitation group, and sends them via Gmail with one click. 

## Features 

- Pulls all guests from Supabase, grouped by `invitation_group`
- Organizes the Invite Sender and RSVP Dashboard into sections by `invite_group` (Praanya, Biswas, Jain) — one section per inviting family
- Three independent email templates (one per `invite_group`) so each family can have its own copy/styling
- Auto-generates a styled HTML email for each group with the hot air balloon background
- Lists all group members by name in the email
- Includes event details, dress code, RSVP link, and website password
- One-click send per group, "Send All Unsent" per family section, or "Send All Unsent" globally
- All recipients BCC'd (privacy-friendly)
- Tracks which invitations have been sent (persisted in Supabase)
- Email preview before sending 

---

## Setup (Step by Step)

### 1. Create a Gmail App Password

You need an App Password so the app can send emails from your Gmail. **This is NOT your normal Gmail password.**

1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Make sure **2-Step Verification** is turned ON (required)
3. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select app: **Mail**, select device: **Other** (type "Invite Sender")
5. Click **Generate**
6. Copy the 16-character password (looks like `abcd efgh ijkl mnop`)
7. Save it — you'll need it for the environment variables below

### 2. Run the Supabase Migrations

The app needs two extra columns on your existing `guests` table:

- `invite_sent_at` — tracks when each invite was sent
- `invite_group` — associates each invitee with the family inviting them (`praanya`, `biswas`, or `jain`)

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Paste these and run them:

```sql
-- Track when invites were sent
alter table guests add column if not exists invite_sent_at timestamptz;

-- Associate each invitee with a family inviting them
alter table guests add column if not exists invite_group text;

-- Restrict invite_group to the three allowed values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guests_invite_group_check'
  ) then
    alter table guests
      add constraint guests_invite_group_check
      check (invite_group is null or invite_group in ('praanya', 'biswas', 'jain'));
  end if;
end $$;
```

That's it. Your existing guest data is untouched.

> Set each guest's `invite_group` to `praanya`, `biswas`, or `jain` in the Supabase Table Editor. Anyone left null will appear in an "Unassigned" section in the dashboards and will receive the **Praanya** template by default.

### 3. Deploy to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select `pbswimmer3/engagement-website-invite-scheduler`
4. Vercel auto-detects Next.js — leave all build settings as default
5. **Add these environment variables** before clicking Deploy:

| Variable | Value | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Same as your engagement website |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Same as your engagement website |
| `GMAIL_USER` | `your.email@gmail.com` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | `abcd efgh ijkl mnop` | From Step 1 above |
| `WEBSITE_URL` | `https://your-engagement-site.vercel.app` | Your deployed engagement website URL |
| `WEBSITE_PASSWORD_PRAANYA` | `PraanyaForever2026` | Password shown at the bottom of the Praanya invite template |
| `WEBSITE_PASSWORD_BISWAS` | `BiswasForever2026` | Password shown at the bottom of the Biswas invite template |
| `WEBSITE_PASSWORD_JAIN` | `JainForever2026` | Password shown at the bottom of the Jain invite template |
| `WEBSITE_PASSWORD` | `Forever2026` | Optional fallback used only if a group-specific password above is not set |

6. Click **Deploy**
7. Once deployed, open the URL — you'll see the invite dashboard

### 4. (Optional) Run Locally

```bash
# Clone the repo
git clone https://github.com/pbswimmer3/engagement-website-invite-scheduler.git
cd engagement-website-invite-scheduler

# Install dependencies
npm install

# Create .env.local (copy the example and fill in your values)
cp .env.local.example .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Use

1. Open the deployed app URL
2. You'll see all your invitation groups listed as cards
3. Each card shows the guest names and their email addresses
4. Click **Preview** to see exactly what the email will look like
5. Click **Send** to send the invite to that group (all emails BCC'd)
6. Or click **Send All Unsent** at the top to send every unsent invite at once
7. Sent invites show a green checkmark and timestamp
8. You can **Resend** any invite if needed.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) |
| `GMAIL_USER` | Yes | Gmail address to send from |
| `GMAIL_APP_PASSWORD` | Yes | Gmail App Password (NOT your login password) |
| `WEBSITE_URL` | Yes | Your engagement website URL (for the RSVP link) |
| `WEBSITE_PASSWORD_PRAANYA` | Yes* | Password shown at the bottom of the Praanya invite template |
| `WEBSITE_PASSWORD_BISWAS` | Yes* | Password shown at the bottom of the Biswas invite template |
| `WEBSITE_PASSWORD_JAIN` | Yes* | Password shown at the bottom of the Jain invite template |
| `WEBSITE_PASSWORD` | No | Optional fallback used when a group-specific password is not set |

\* Each template will use its group-specific password if set; otherwise it falls back to `WEBSITE_PASSWORD`. Set either all three group-specific vars (for distinct passwords per family) or just `WEBSITE_PASSWORD` (same password everywhere).

---

## Customizing the Emails

All three templates live in `lib/email-template.ts`. The file is organized as:

1. `EVENT` constants at the top (date, time, venue, address) — **shared by all three templates**
2. Three template functions — **one per `invite_group`**, fully independent of each other:
   - `generateEmailHTML_praanya(...)` — sent to guests with `invite_group = 'praanya'`
   - `generateEmailHTML_biswas(...)`  — sent to guests with `invite_group = 'biswas'`
   - `generateEmailHTML_jain(...)`    — sent to guests with `invite_group = 'jain'`
3. A router function `generateEmailHTML(...)` that picks the right template based on the invitee's `invite_group`. Guests whose `invite_group` is null/unrecognized fall back to the Praanya template.
4. `generateSubject(...)` — used for all templates' subject line.

### To change a single family's template

Open `lib/email-template.ts`, find the section header for that family (e.g. `// ─── TEMPLATE: BISWAS ───`), and edit just that function. Things you can change per template:

- **Greeting / body copy** — the `<p>` tags inside the BODY section
- **Header text** (e.g. "You're Cordially Invited to") — inside the HEADER section
- **Footer signature** (e.g. "With love, Aanya & Prad") — inside the FOOTER section
- **Colors / styling** — the inline `style="..."` attributes
- **Dress code text** — the italic `<p>` near the bottom of the body

The other two templates are unaffected.

### To change something for all three templates

- **Event details** (date, time, venue, address) — edit the `EVENT` constants at the top of the file (shared by all three)
- **Subject line** — edit `generateSubject()` at the bottom of the file
- **Anything else (e.g. footer)** — currently you have to update each template function individually. The three were intentionally kept as separate copies (instead of sharing a layout) so each family can diverge freely.

### To preview a template

In the Invite Sender dashboard, click **Preview** on any invitation card — you'll see the exact HTML that will be sent to that guest, using their family's template.
