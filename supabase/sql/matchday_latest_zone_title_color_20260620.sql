ALTER TABLE public.matchday_editorials
ADD COLUMN IF NOT EXISTS latest_zone_title_color text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matchday_editorials_latest_zone_title_color_hex_check'
  ) THEN
    ALTER TABLE public.matchday_editorials
    ADD CONSTRAINT matchday_editorials_latest_zone_title_color_hex_check
    CHECK (
      latest_zone_title_color IS NULL
      OR latest_zone_title_color ~ '^#[0-9A-Fa-f]{6}$'
    );
  END IF;
END $$;

COMMENT ON COLUMN public.matchday_editorials.latest_zone_title_color
IS 'Hex color for the public title of the matchday final editorial zone.';

NOTIFY pgrst, 'reload schema';
