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

function percentFromMinutes(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function aggregateFlightTotals(rows: FlightTotalsRow[]) {
  const total = rows.reduce((acc, row) => acc + (row.block_time_minutes || 0), 0);
  const pic = rows.reduce((acc, row) => acc + (row.pic_time_minutes || 0), 0);
  const copilot = rows.reduce((acc, row) => acc + (row.sic_time_minutes || 0), 0);
  const dual = rows.reduce((acc, row) => {
    if (row.operating_capacity === 'dual') return acc + (row.block_time_minutes || 0);
    return acc;
  }, 0);
  const instruction = rows.reduce((acc, row) => {
    if (row.operating_capacity === 'instructor') return acc + (row.block_time_minutes || 0);
    return acc;
  }, 0);
  const crossCountry = rows.reduce((acc, row) => {
    if ((row.cross_country_total_minutes || 0) > 0) return acc + (row.cross_country_total_minutes || 0);
    if (row.is_cross_country) return acc + (row.block_time_minutes || 0);
    return acc;
  }, 0);
  const simulator = rows.reduce((acc, row) => acc + (row.ifr_simulated_minutes || 0), 0);
  const night = rows.reduce((acc, row) => acc + (row.night_time_minutes || 0), 0);
  const ifrDual = simulator;
  const multiEngine = rows.reduce((acc, row) => acc + (row.instrument_time_minutes || 0), 0);
  const nightDual = Math.min(night, dual);
  const nightSolo = Math.max(night - nightDual, 0);
  const cplTarget = 200 * 60;
  const remaining = Math.max(cplTarget - total, 0);
  const progress = percentFromMinutes(total, cplTarget);

  return {
    total,
    pic,
    copilot,
    dual,
    instruction,
    crossCountry,
    night,
    ifrDual,
    multiEngine,
    nightDual,
    nightSolo,
    remaining,
    progress,
  };
}
