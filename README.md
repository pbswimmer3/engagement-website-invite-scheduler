# Engagement Invite Sender

A simple admin app to send email invitations to guests for Aanya & Prad's engagement party. Connects to the same Supabase database as the engagement website, auto-generates personalized HTML emails per invitation group, and sends them via Gmail with one click.

## Features 

- Pulls all guests from Supabase, grouped by `invitation_group`
- Auto-generates a styled HTML email for each group with the hot air balloon background
- Lists all group members by name in the email
- Includes event details, dress code, RSVP link, and website password
- One-click send per group, or "Send All Unsent" for bulk
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

### 2. Run the Supabase Migration

The app needs an `invite_sent_at` column on your existing `guests` table to track which invites have been sent.

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Paste this and run it:

```sql
alter table guests add column if not exists invite_sent_at timestamptz;
```

That's it. Your existing guest data is untouched.

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
| `WEBSITE_PASSWORD` | `Forever2026` | The password guests enter on the website |

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
| `WEBSITE_PASSWORD` | Yes | Site password included in the email so guests can log in |

---

## Customizing the Email

Edit `lib/email-template.ts` to change:

- **Event details** (date, time, venue) — constants at the top of the file
- **Email copy** — the greeting, body text, and closing
- **Styling** — inline CSS in the HTML template
- **Subject line** — the `generateSubject()` function
