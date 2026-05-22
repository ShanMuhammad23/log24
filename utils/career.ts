import { supabase } from '@/utils/supabase';

export type FlightTotalsRow = {
  block_time_minutes: number | null;
  pic_time_minutes: number | null;
  sic_time_minutes: number | null;
  night_time_minutes: number | null;
  instrument_time_minutes: number | null;
  instrument_timings_minutes: number | null;
  ifr_actual_minutes: number | null;
  ifr_simulated_minutes: number | null;
  operating_capacity: string | null;
  is_cross_country: boolean | null;
  cross_country_total_minutes: number | null;
  aircraft_type: string | null;
};

export const CAREER_TARGETS = {
  total: 200 * 60,
  pic: 100 * 60,
  crossCountry: 50 * 60,
  instrument: 20 * 60,
} as const;

export type CareerHourSummary = {
  total: number;
  soloPic: number;
  crossCountry: number;
  instrument: number;
  dual: number;
  generalFlying: number;
  checks: {
    total: number;
    hour250: number;
    hour120: number;
    day: number;
    night: number;
    irt: number;
    nightPic: number;
  };
  pic: {
    total: number;
    xc: number;
    hour250: number;
    hour120: number;
    gft: { day: number; night: number; irt: number; nightPic: number };
  };
  instrumentBreakdown: {
    total: number;
    ifActual: number;
    ifDual: number;
  };
};

export async function fetchCareerTotals(userId: string) {
  return supabase
    .from('flights')
    .select(
      'block_time_minutes,pic_time_minutes,sic_time_minutes,night_time_minutes,instrument_time_minutes,instrument_timings_minutes,ifr_actual_minutes,ifr_simulated_minutes,operating_capacity,is_cross_country,cross_country_total_minutes,aircraft_type'
    )
    .eq('user_id', userId);
}

export function formatCareerHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function rowBlock(row: FlightTotalsRow) {
  return row.block_time_minutes || 0;
}

function normalizeCapacity(row: FlightTotalsRow) {
  return (row.operating_capacity || '').toLowerCase();
}

/** PIC hours for home/career when legacy rows lack pic_time_minutes. */
export function picMinutesForRow(row: FlightTotalsRow) {
  const stored = row.pic_time_minutes || 0;
  if (stored > 0) return stored;
  const capacity = normalizeCapacity(row);
  if (['pic', 'solo', 'p1u_s', 'examiner', 'instructor'].includes(capacity)) {
    return row.block_time_minutes || 0;
  }
  return 0;
}

/** Dual / SIC hours for home when legacy rows lack sic_time_minutes. */
export function dualMinutesForRow(row: FlightTotalsRow) {
  const stored = row.sic_time_minutes || 0;
  if (stored > 0) return stored;
  const capacity = normalizeCapacity(row);
  if (capacity === 'dual' || ['copilot', 'observer', 'relief'].includes(capacity)) {
    return row.block_time_minutes || 0;
  }
  return 0;
}

function rowPic(row: FlightTotalsRow) {
  return picMinutesForRow(row);
}

function rowNight(row: FlightTotalsRow) {
  return row.night_time_minutes || 0;
}

function rowCrossCountry(row: FlightTotalsRow) {
  if ((row.cross_country_total_minutes || 0) > 0) return row.cross_country_total_minutes || 0;
  if (row.is_cross_country) return rowBlock(row);
  return 0;
}

function rowInstrument(row: FlightTotalsRow) {
  const actual = (row.ifr_actual_minutes || 0) + (row.ifr_simulated_minutes || 0);
  const logged = row.instrument_time_minutes || row.instrument_timings_minutes || 0;
  return Math.max(actual, logged);
}

function isAircraft250(row: FlightTotalsRow) {
  const aircraft = (row.aircraft_type || '').toLowerCase();
  return /152|150|citabria|250/i.test(aircraft);
}

function isAircraft120(row: FlightTotalsRow) {
  const aircraft = (row.aircraft_type || '').toLowerCase();
  return /172|172s|172n|120|c172/i.test(aircraft);
}

function splitPicByAircraft(p: number, row: FlightTotalsRow) {
  if (p <= 0) return { hour250: 0, hour120: 0 };
  if (isAircraft250(row)) return { hour250: p, hour120: 0 };
  if (isAircraft120(row)) return { hour250: 0, hour120: p };
  return { hour250: 0, hour120: 0 };
}

export function aggregateCareerHourSummary(rows: FlightTotalsRow[]): CareerHourSummary {
  let total = 0;
  let soloPic = 0;
  let dual = 0;
  let crossCountry = 0;
  let generalFlying = 0;
  let checksTotal = 0;
  let checks250 = 0;
  let checks120 = 0;
  let checksDay = 0;
  let checksNight = 0;
  let checksIrt = 0;
  let checksNightPic = 0;
  let picTotal = 0;
  let picXc = 0;
  let pic250 = 0;
  let pic120 = 0;
  let gftDay = 0;
  let gftNight = 0;
  let gftIrt = 0;
  let gftNightPic = 0;
  let ifTotal = 0;
  let ifActual = 0;
  let ifDual = 0;

  for (const row of rows) {
    const capacity = row.operating_capacity?.toLowerCase() ?? '';
    const block = rowBlock(row);
    const pic = rowPic(row);
    const night = rowNight(row);
    const xc = rowCrossCountry(row);
    const instrument = rowInstrument(row);
    const ifrLogged = (row.ifr_actual_minutes || 0) + (row.ifr_simulated_minutes || 0);

    total += block;
    crossCountry += xc;
    ifTotal += instrument;
    ifActual += ifrLogged;

    if (capacity === 'dual') {
      dual += dualMinutesForRow(row);
      ifDual += Math.min(instrument, block);
    } else if (capacity === 'solo') {
      soloPic += pic > 0 ? pic : block;
    } else if (capacity === 'instructor') {
      generalFlying += block;
    } else if (capacity === 'examiner') {
      checksTotal += block;
      const checkNight = Math.min(night, block);
      checksDay += block - checkNight;
      checksNight += checkNight;
      checksIrt += Math.min(instrument, block);
      checksNightPic += Math.min(night, pic);
      const split = splitPicByAircraft(block, row);
      checks250 += split.hour250;
      checks120 += split.hour120;
    } else if (capacity === 'pic' || capacity === 'p1u_s') {
      generalFlying += block;
    }

    picTotal += pic;
    if (xc > 0) picXc += pic > 0 ? Math.min(pic, xc) : xc;

    const aircraftSplit = splitPicByAircraft(pic, row);
    pic250 += aircraftSplit.hour250;
    pic120 += aircraftSplit.hour120;

    const picNight = Math.min(pic, night);
    const picDay = Math.max(pic - picNight, 0);
    gftDay += picDay;
    gftNight += picNight;
    gftIrt += Math.min(instrument, pic);
    if (capacity === 'solo') gftNightPic += picNight;
  }

  return {
    total,
    soloPic,
    crossCountry,
    instrument: ifTotal,
    dual,
    generalFlying,
    checks: {
      total: checksTotal,
      hour250: checks250,
      hour120: checks120,
      day: checksDay,
      night: checksNight,
      irt: checksIrt,
      nightPic: checksNightPic,
    },
    pic: {
      total: picTotal,
      xc: picXc,
      hour250: pic250,
      hour120: pic120,
      gft: { day: gftDay, night: gftNight, irt: gftIrt, nightPic: gftNightPic },
    },
    instrumentBreakdown: {
      total: ifTotal,
      ifActual,
      ifDual,
    },
  };
}

function percentFromMinutes(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function aggregateFlightTotals(rows: FlightTotalsRow[]) {
  const total = rows.reduce((acc, row) => acc + (row.block_time_minutes || 0), 0);
  const pic = rows.reduce((acc, row) => acc + picMinutesForRow(row), 0);
  const copilot = rows.reduce((acc, row) => acc + (row.sic_time_minutes || 0), 0);
  const dual = rows.reduce((acc, row) => acc + dualMinutesForRow(row), 0);
  const instruction = rows.reduce((acc, row) => {
    if (normalizeCapacity(row) === 'instructor') return acc + (row.block_time_minutes || 0);
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
