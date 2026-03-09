

## Plan: Add `kinedu_signup_url` override to `send-recovery-email` edge function

### Current State
The `send-recovery-email` function has the Kinedu signup URL hardcoded in the HTML template (`https://app.kinedu.com/ia-signuppage/?swc=ia-report`) in 5 places. There is no `KINEDU_SIGNUP_URL` variable.

### Changes

**`supabase/functions/send-recovery-email/index.ts`**

1. Add a `let` variable at the top (after CORS headers): `let KINEDU_SIGNUP_URL = "https://app.kinedu.com/ia-signuppage/?swc=ia-report";`
2. Change line 252: `const { session_id, is_second_email } = await req.json()` → `const { session_id, is_second_email, kinedu_signup_url } = await req.json()`
3. Add after destructuring: `if (kinedu_signup_url) { KINEDU_SIGNUP_URL = kinedu_signup_url; }`
4. Replace all 5 hardcoded `https://app.kinedu.com/ia-signuppage/?swc=ia-report` references in the HTML template with `${KINEDU_SIGNUP_URL}`

No frontend changes needed since `send-recovery-email` is called from `check-abandoned-assessments` (server-side), not from the frontend.

