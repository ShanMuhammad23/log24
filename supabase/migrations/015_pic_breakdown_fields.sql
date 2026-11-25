-- Detailed PIC logbook breakdown (sums to pic_time_minutes / career Solo PIC)
alter table public.flights
  add column if not exists pic_ccts_day_minutes integer check (pic_ccts_day_minutes is null or pic_ccts_day_minutes >= 0),
  add column if not exists pic_ccts_night_minutes integer check (pic_ccts_night_minutes is null or pic_ccts_night_minutes >= 0),
  add column if not exists pic_xcty_minutes integer check (pic_xcty_minutes is null or pic_xcty_minutes >= 0),
  add column if not exists pic_night_category_minutes integer check (pic_night_category_minutes is null or pic_night_category_minutes >= 0),
  add column if not exists pic_gft_300nm_minutes integer check (pic_gft_300nm_minutes is null or pic_gft_300nm_minutes >= 0),
  add column if not exists pic_gft_250nm_minutes integer check (pic_gft_250nm_minutes is null or pic_gft_250nm_minutes >= 0),
  add column if not exists pic_gft_120nm_minutes integer check (pic_gft_120nm_minutes is null or pic_gft_120nm_minutes >= 0),
  add column if not exists pic_gft_day_minutes integer check (pic_gft_day_minutes is null or pic_gft_day_minutes >= 0),
  add column if not exists pic_gft_night_minutes integer check (pic_gft_night_minutes is null or pic_gft_night_minutes >= 0),
  add column if not exists pic_multi_day_minutes integer check (pic_multi_day_minutes is null or pic_multi_day_minutes >= 0),
  add column if not exists pic_multi_night_minutes integer check (pic_multi_night_minutes is null or pic_multi_night_minutes >= 0),
  add column if not exists pic_multi_irt_minutes integer check (pic_multi_irt_minutes is null or pic_multi_irt_minutes >= 0);
