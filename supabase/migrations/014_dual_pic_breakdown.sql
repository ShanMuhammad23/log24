-- Dual / PIC hour breakdown (child fields sum to role totals on career screen)
alter table public.flights
  add column if not exists dual_extra_minutes integer check (dual_extra_minutes is null or dual_extra_minutes >= 0),
  add column if not exists dual_night_minutes integer check (dual_night_minutes is null or dual_night_minutes >= 0),
  add column if not exists dual_if_minutes integer check (dual_if_minutes is null or dual_if_minutes >= 0),
  add column if not exists dual_multi_minutes integer check (dual_multi_minutes is null or dual_multi_minutes >= 0),
  add column if not exists pic_extra_minutes integer check (pic_extra_minutes is null or pic_extra_minutes >= 0),
  add column if not exists pic_night_minutes integer check (pic_night_minutes is null or pic_night_minutes >= 0),
  add column if not exists pic_if_minutes integer check (pic_if_minutes is null or pic_if_minutes >= 0),
  add column if not exists pic_multi_minutes integer check (pic_multi_minutes is null or pic_multi_minutes >= 0);
