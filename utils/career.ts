import { supabase } from '@/utils/supabase';

export type FlightTotalsRow = {
  block_time_minutes: number | null;
  pic_time_minutes: number | null;
  sic_time_minutes: number | null;
  night_time_minutes: number | null;
  instrument_time_minutes: number | null;
  operating_capacity: string | null;
  is_cross_country: boolean | null;
  cross_country_total_minutes: number | null;
  ifr_simulated_minutes: number | null;
};

export async function fetchCareerTotals(userId: string) {
  return supabase
    .from('flights')
    .select(
      'block_time_minutes,pic_time_minutes,sic_time_minutes,night_time_minutes,instrument_time_minutes,operating_capacity,is_cross_country,cross_country_total_minutes,ifr_simulated_minutes'
    )
    .eq('user_id', userId);
}
