ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS dashboard_notice_dismissed BOOLEAN DEFAULT FALSE;

UPDATE public.user_preferences
SET dashboard_notice_dismissed = FALSE
WHERE dashboard_notice_dismissed IS NULL;

ALTER TABLE public.user_preferences
  ALTER COLUMN dashboard_notice_dismissed SET NOT NULL;
