

# Fix: Incorrect Progress, Areas, and Skills in Assessment Breakdown

## Problem

When viewing Maria's assessment breakdown, three metrics are wrong:
- **Areas**: Should show she selected 4 areas, but it's incorrect
- **Progress**: Shows 63/63 (100%) but she abandoned the assessment
- **Skills**: Shows 3/3 completed but should be X out of total assigned skills

### Root Causes

1. **No `abandoned_session` record exists** for Maria's assessment -- the row was either never created or the insert failed silently. Without it, `selected_areas` is empty and `progress_percentage` is null.
2. **Newborn exclusion bug (line 215)**: The code checks `ageMonths > 0` before querying total milestones, but Maria is age 0 (newborn). This means the query to get the real total assigned milestones never runs.
3. **Fallback makes everything look complete**: When the query doesn't run, `totalExpectedMilestones` falls back to `responses.length` (63), making progress = 63/63 = 100%.

## Solution

### 1. Fix the newborn exclusion (`ageMonths > 0` to `ageMonths >= 0`)

Change line 215 condition so newborns (age 0) are not excluded from the total milestones query.

### 2. Infer `selectedAreas` from responses when `abandoned_session` is missing

When no `abandoned_session` record exists, derive the selected areas from the distinct `area_id` values in `assessment_responses`. This won't capture unstarted areas (like Socio-Emotional for Maria), but it's a better fallback than nothing.

### 3. Query total milestones using the external DB with correct logic

For the "assigned milestones" query, use the `skill_milestone` table (which maps milestones to skills for specific age ranges) instead of the `milestones` table with `lte('age', ageMonths)`. This will return the actual milestones that were presented to the user.

Alternatively, since we know exactly which skills were assessed (from `assessment_responses`), query the external DB for all milestones belonging to those skills at that age to get the true total -- including milestones from areas the user selected but never reached.

### 4. Better fallback for areas selected count

When `abandoned_session` is missing:
- Count distinct areas from responses as a minimum
- If the assessment is incomplete (no `completed_at`), note in the UI that the area count may be partial

## Technical Changes

### File: `src/components/AssessmentBreakdownDialog.tsx`

**Change 1** -- Fix newborn exclusion (line 215):
```typescript
// Before:
if (ageMonths > 0 && selectedAreas.length > 0) {

// After:
if (selectedAreas.length > 0) {
```

**Change 2** -- Infer selected areas when no abandoned_session (after line 186):
```typescript
// When no abandoned_session, infer from responses
let selectedAreas: number[] = (abandonedSession?.selected_areas as number[]) || [];
if (selectedAreas.length === 0 && responses.length > 0) {
  selectedAreas = [...new Set(responses.map(r => r.area_id).filter(Boolean) as number[])];
}
```

**Change 3** -- Also query total milestones by skill_ids from responses as a second strategy when selected areas alone don't work. When `ageMonths === 0`, adjust the milestones query to use `eq('age', 0)` instead of `lte('age', 0)` (they're equivalent for 0, but being explicit).

**Change 4** -- Fix progress percentage calculation to not use `progress_percentage` from abandoned_session blindly (it can be stale). Instead, always compute dynamically: `answered / totalExpectedMilestones * 100`.

These changes ensure that even when the `abandoned_session` record is missing or incomplete, the breakdown dialog shows accurate metrics derived from the actual assessment responses and the external milestones database.

