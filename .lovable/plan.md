

## Plan: Accept environment-aware URLs from frontend in 3 edge functions

### Changes

**1. `register-kinedu-user` edge function**
- Accept `kinedu_api_base_url` from request body
- Use it as first priority: `kinedu_api_base_url || env.KINEDU_API_BASE_URL || fallback`

**2. `send-report-email` edge function**
- Accept `kinedu_signup_url` from request body
- If provided, override the hardcoded `CTA_URL` (`https://app.kinedu.com/ia-signuppage/?swc=ia-report`)

**3. Frontend callers (BabyForm.tsx, Report.tsx)**
- Pass `kinedu_api_base_url` when invoking `register-kinedu-user`
- Pass `kinedu_signup_url` when invoking `send-report-email`
- These values can come from environment variables (e.g. `VITE_KINEDU_API_BASE_URL`, `VITE_KINEDU_SIGNUP_URL`) or be hardcoded for now

### File changes

| File | Change |
|------|--------|
| `supabase/functions/register-kinedu-user/index.ts` | Destructure `kinedu_api_base_url` from body; use as priority in `baseUrl` |
| `supabase/functions/send-report-email/index.ts` | Destructure `kinedu_signup_url` from body; override `CTA_URL` if provided |
| `src/pages/BabyForm.tsx` | Pass `kinedu_api_base_url` in the invoke body |
| `src/pages/Report.tsx` | Pass `kinedu_signup_url` in both email send calls |

### Notes
- `send-recovery-email` and `check-abandoned-assessments` are not modified since the user only mentioned 2 specific changes (register-kinedu-user and send-report-email based on the destructuring patterns described)
- The `CTA_URL` in send-report-email is used in multiple places within the HTML template; overriding the variable at the top covers all usages

