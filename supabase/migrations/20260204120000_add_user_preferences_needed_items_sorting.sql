ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS needed_items_sort_by TEXT,
  ADD COLUMN IF NOT EXISTS needed_items_sort_direction TEXT,
  ADD COLUMN IF NOT EXISTS needed_items_hide_owned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS needed_items_card_style TEXT;
