ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS live_started_at timestamptz;

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS live_base_minute integer;

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS is_clock_running boolean DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matches_live_base_minute_range_check'
  ) THEN
    ALTER TABLE public.matches
    ADD CONSTRAINT matches_live_base_minute_range_check
    CHECK (
      live_base_minute IS NULL
      OR live_base_minute BETWEEN 0 AND 130
    );
  END IF;
END $$;

COMMENT ON COLUMN public.matches.live_started_at
IS 'Timestamp used as the reference start/resume time for calculated live match clock.';

COMMENT ON COLUMN public.matches.live_base_minute
IS 'Base match minute used together with live_started_at to calculate the public live minute.';

COMMENT ON COLUMN public.matches.is_clock_running
IS 'Whether the calculated live match clock is currently running.';

NOTIFY pgrst, 'reload schema';
