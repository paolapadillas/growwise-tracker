

# Landing Page Conversion Optimization

## Goal
Reduce the 78% drop-off rate to ~40% by applying conversion-focused changes to the Index page, following the 7 specific recommendations provided.

---

## Changes Overview

### 1. Radical Above-the-Fold Simplification (Index.tsx - Hero Section)

**Current state:** Hero has illustration image, long sub-copy with "FREE" in caps, verbose trust badges, and decorative separators.

**Changes:**
- Replace the `baby-development-illustration.png` with a placeholder for a real baby photo (will use a high-quality stock photo of a real baby looking at camera). Add a note/comment for the team to swap in the ad-matching photo.
- Shorten sub-copy to: *"Answer a few quick questions. Get your baby's personalized development report instantly."*
- Change CTA text to: **"Start Assessment -- It's Free"** (no screaming "FREE" in caps)
- Simplify trust bar to just three short items: "2 min -- No credit card -- Stanford-backed" in a single clean line
- Add social proof line above CTA: *"Join 500,000+ parents who've already checked"*

### 2. Remove Everything Below Hero CTA (Index.tsx)

**Remove entirely:**
- SkillsOverview component (4 developmental area cards + View Demo button)
- "4 Simple Steps" section
- Both decorative double-line separators between sections
- The "Why Trust Us" Stanford/Harvard card section

**Keep:**
- Bottom CTA section (simplified)
- Footer

This eliminates all cognitive friction content. The user came from an ad; they don't need more convincing.

### 3. Simplify Bottom CTA Section

- Remove the "Start Your Baby's Development Journey Today" heading
- Replace with a simpler repeat of the main CTA with the social proof line
- Keep the authenticated dashboard button

### 4. Implement "Foot in the Door" Inline Age Selector

Instead of navigating to `/babies/new` on CTA click, embed a simple inline age question directly on the landing page below the CTA:

- After clicking "Start Assessment -- It's Free", smoothly reveal a simple section: **"How old is your baby?"** with a grid of age range buttons (e.g., "0-3 months", "4-6 months", "7-9 months", "10-12 months", "1-2 years", "2-3 years", "3+ years")
- Selecting an age range navigates to `/babies/new` with the approximate age pre-filled as a query parameter
- This uses the "foot in the door" psychological technique -- once they answer one question, they're committed

### 5. Time Reference Update

- Change all "5 minutes" references to "2 min" in the trust bar
- Keep it vague and short

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Major rewrite: strip sections, new hero copy, inline age selector, social proof |
| `src/components/SkillsOverview.tsx` | No changes (just removed from Index import) |
| `src/pages/BabyForm.tsx` | Read `age_range` query param to pre-select approximate birth date |

### New Component State (Index.tsx)

- `showAgeSelector: boolean` -- toggles the inline age picker after CTA click
- Age range buttons that navigate to `/babies/new?age_range=X`

### BabyForm.tsx Updates

- Parse `age_range` query parameter on mount
- Auto-calculate an approximate birth date from the age range and pre-fill it
- User can still adjust the exact date

### Tracking

- Keep existing `landing_start_clicked` event tracking
- Add `age_range` to the event data when user selects an age range
- Track source as `hero_age_selector`

---

## Resulting Page Structure

```text
+----------------------------------+
|          Kinedu Logo             |
|                                  |
|   "Is your baby on track?"      |
|                                  |
|   [Real baby photo]             |
|                                  |
|   Short sub-copy (1 line)       |
|                                  |
|   "Join 500,000+ parents..."    |
|                                  |
|   [Start Assessment - It's Free]|
|                                  |
|   2 min · No credit card ·      |
|   Stanford-backed                |
|                                  |
|   --- (after click) ---         |
|   "How old is your baby?"       |
|   [0-3mo] [4-6mo] [7-9mo]      |
|   [10-12mo] [1-2yr] [2-3yr]    |
|                                  |
+----------------------------------+
|          Footer                  |
+----------------------------------+
```

