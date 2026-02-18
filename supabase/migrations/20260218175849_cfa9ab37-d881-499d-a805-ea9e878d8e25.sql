
-- Create abandoned_sessions table for recovery system
CREATE TABLE public.abandoned_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  baby_id uuid REFERENCES public.babies(id),
  assessment_id uuid REFERENCES public.assessments(id),
  baby_name text,
  baby_birthday date,
  email text,
  selected_areas jsonb DEFAULT '[]'::jsonb,
  completed_areas jsonb DEFAULT '[]'::jsonb,
  current_area_id smallint DEFAULT 2,
  current_skill_index smallint DEFAULT 0,
  milestone_answers jsonb DEFAULT '{}'::jsonb,
  progress_percentage numeric DEFAULT 0,
  abandoned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  second_email_sent boolean DEFAULT false,
  completed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.abandoned_sessions ENABLE ROW LEVEL SECURITY;

-- Public insert (anonymous users creating sessions)
CREATE POLICY "Anyone can insert abandoned sessions"
  ON public.abandoned_sessions FOR INSERT
  WITH CHECK (true);

-- Public update (anonymous users saving progress)
CREATE POLICY "Anyone can update abandoned sessions"
  ON public.abandoned_sessions FOR UPDATE
  USING (true);

-- Public select (resume route needs to look up by session_id)
CREATE POLICY "Anyone can view abandoned sessions"
  ON public.abandoned_sessions FOR SELECT
  USING (true);
