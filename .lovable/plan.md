

# Abandoned Assessment Recovery -- Email + Resume Link System

## Overview

Build a system that saves assessment progress for users who leave mid-assessment, generates a unique resume link, and sends a recovery email after 30 minutes of inactivity. Users clicking the resume link skip onboarding and land exactly where they left off.

---

## Part 1: New Database Table

Create an `abandoned_sessions` table to track in-progress assessments:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| session_id | text | Unique, from existing analytics session |
| baby_id | uuid | FK to babies |
| assessment_id | uuid | FK to assessments |
| baby_name | text | Cached from onboarding |
| baby_birthday | date | Cached from onboarding |
| email | text | From onboarding step 3 |
| selected_areas | jsonb | Array of area IDs e.g. [2,1,3,4] |
| completed_areas | jsonb | Array of completed area IDs |
| current_area_id | smallint | Area where user left |
| current_skill_index | smallint | Skill index within area |
| milestone_answers | jsonb | Object of milestone_id -> answer |
| progress_percentage | numeric | 0-100 |
| abandoned_at | timestamptz | Last interaction timestamp |
| created_at | timestamptz | Session start |
| email_sent | boolean | Default false |
| email_sent_at | timestamptz | When first email was sent |
| second_email_sent | boolean | Default false |
| completed | boolean | Default false |

RLS: Public insert + update (unclaimed babies pattern), public select by session_id match.

---

## Part 2: Auto-Save Progress

### 2a. Save on skill completion / area transition

In `AssessmentNew.tsx`, after every `handleNextSkill` and `handleContinueFromSummary` call, upsert to `abandoned_sessions` with current state:

- Serialize `responses` as `milestone_answers`
- Track `completed_areas` by checking which areas have all skills answered
- Update `current_area_id`, `current_skill_index`, `progress_percentage`, `abandoned_at`

### 2b. Save on page unload / visibility change

Add `beforeunload` and `visibilitychange` event listeners in `AssessmentNew.tsx` that trigger a save using `navigator.sendBeacon` (reliable even when tab closes) to a small edge function or direct Supabase upsert.

### 2c. Create session on assessment start

In `BabyForm.tsx` `handleSubmit`, after creating baby + assessment, also create the `abandoned_sessions` row with initial data (name, birthday, email, selected areas, progress 24%).

---

## Part 3: Resume Route (`/resume`)

### 3a. New route in App.tsx

Add `/resume` route pointing to a new `ResumeAssessment.tsx` page.

### 3b. ResumeAssessment.tsx logic

1. Read `session` query param
2. Fetch `abandoned_sessions` row by `session_id`
3. If not found or `completed === true`, show "session expired" message
4. If found:
   - Load assessment + baby data from existing `assessments` and `babies` tables
   - Restore `selected_areas` to localStorage
   - Navigate to `/assessment/{assessment_id}` with a query param like `?resume=true`
5. In `AssessmentNew.tsx`, detect `resume` param:
   - Load `abandoned_sessions` row
   - Set `viewState` to `{ type: 'skill', areaIndex: X, skillIndex: Y }` matching saved position
   - Pre-populate `responses` from `milestone_answers` (merged with DB responses)

---

## Part 4: Recovery Email Edge Function

### 4a. New edge function: `send-recovery-email`

- Accepts `session_id` as parameter
- Fetches session data from `abandoned_sessions`
- Validates `email` exists, `completed === false`, `email_sent === false`
- Builds HTML email using the provided template with dynamic variables:
  - `baby_name` (4 occurrences)
  - `progress_percentage` (number + CSS width)
  - Area checklist (completed = green checkmark + strikethrough, current = bold + "You stopped here" amber label, pending = gray number)
  - Resume CTA link: `https://growwise-tracker.lovable.app/resume?session={session_id}`
- Uses Kinedu logo from storage bucket and area icons
- Sends via Resend (RESEND_API_KEY already configured)
- Subject: `{baby_name}'s development report is {progress_percentage}% done`
- Sets `email_sent = true` and `email_sent_at = now()` after successful send

### 4b. Second email (24h later)

- Same function, accepts `is_second_email` flag
- Changes subject to: "Last chance -- {baby_name}'s assessment expires soon"
- Changes headline to urgency messaging
- Sets `second_email_sent = true`

---

## Part 5: Cron Job for Abandoned Detection

### 5a. New edge function: `check-abandoned-assessments`

- Queries `abandoned_sessions` where:
  - `email IS NOT NULL`
  - `completed = false`
  - `email_sent = false`
  - `abandoned_at < now() - interval '30 minutes'`
- For each result, calls `send-recovery-email`
- Second pass: checks where `email_sent = true`, `second_email_sent = false`, `email_sent_at < now() - interval '24 hours'`

### 5b. Schedule via pg_cron

Run every 5 minutes:
```text
cron.schedule('check-abandoned-assessments', '*/5 * * * *', ...)
```

---

## Part 6: Mark Session Complete

In `AssessmentNew.tsx`, when assessment completes (navigating to report), update `abandoned_sessions` with `completed = true` so no recovery email is sent.

---

## Technical Details

### Files to create:
- `src/pages/ResumeAssessment.tsx` -- resume route page
- `supabase/functions/send-recovery-email/index.ts` -- recovery email sender
- `supabase/functions/check-abandoned-assessments/index.ts` -- cron checker

### Files to modify:
- `src/App.tsx` -- add `/resume` route
- `src/pages/BabyForm.tsx` -- create abandoned_session row on submit
- `src/pages/AssessmentNew.tsx` -- auto-save logic, resume detection, mark complete
- `supabase/config.toml` -- add new function configs

### Database changes:
- New `abandoned_sessions` table with RLS policies
- Enable `pg_cron` and `pg_net` extensions
- Create cron schedule

### Dependencies:
- No new npm packages needed
- Uses existing Resend integration and storage bucket assets

