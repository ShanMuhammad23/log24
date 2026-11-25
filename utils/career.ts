import { supabase } from '@/utils/supabase';
import {
  picBreakdownMinutesFromRow,
  picCrossCountryMinutesFromRow,
  sumPicBreakdownMinutes,
  type PicBreakdownDbRow,
} from '@/utils/pic-breakdown';

export type FlightTotalsRow = PicBreakdownDbRow & {
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
  dual_extra_minutes: number | null;
  dual_night_minutes: number | null;
  dual_if_minutes: number | null;
  dual_multi_minutes: number | null;
  pic_extra_minutes?: number | null;
  pic_night_minutes?: number | null;
  pic_if_minutes?: number | null;
  pic_multi_minutes?: number | null;
};

export const CAREER_TARGETS = {
  total: 200 * 60,
  pic: 100 * 60,
  crossCountry: 50 * 60,
  instrument: 20 * 60,
} as const;

/** Hour Summary two-column layout targets (minutes). */
export const HOUR_SUMMARY_TARGETS = {
  soloPic: 100 * 60,
  dual: 100 * 60,
  soloCrossCountry: 50 * 60,
  ccts: 30 * 60,
  gft: 8 * 60,
  multiChecks: 4.5 * 60,
  night: 5 * 60,
  dualIf: 20 * 60,
  dualMulti: 11.5 * 60,
  dualNight: 5 * 60,
} as const;

export type HourSummaryColumns = {
  soloPic: {
    total: number;
    crossCountry: number;
    ccts: number;
    gft: number;
    multiChecks: number;
    night: number;
  };
  dual: {
    total: number;
    instrument: number;
    multi: number;
    night: number;
    extra: number;
  };
};

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
    breakdown: {
      cctsDay: number;
      cctsNight: number;
      xcty: number;
      night: number;
      gft300nm: number;
      gft250nm: number;
      gft120nm: number;
      gftDay: number;
      gftNight: number;
      multiDay: number;
      multiNight: number;
      multiIrt: number;
    };
  };
  instrumentBreakdown: {
    total: number;
    ifActual: number;
    ifDual: number;
  };
  dualBreakdown: {
    total: number;
    extra: number;
    night: number;
    instrument: number;
    multi: number;
  };
  hourSummary: HourSummaryColumns;
};

function isSoloPicCapacity(capacity: string) {
  return capacity === 'pic' || capacity === 'solo';
}

function isDualCapacity(capacity: string) {
  return capacity === 'dual';
}

function soloPicCrossCountryMinutes(row: FlightTotalsRow) {
  const capacity = normalizeCapacity(row);
  if (capacity !== 'pic') return 0;

  const pic = picBreakdownMinutesFromRow(row);
  let total = (row.cross_country_total_minutes || 0) + (pic.xcty || 0) + (pic.gft300nm || 0);
  if (total > 0) return total;

  if (row.is_cross_country) return rowBlock(row);
  return 0;
}

export function aggregateHourSummaryColumns(rows: FlightTotalsRow[]): HourSummaryColumns {
  let soloPicTotal = 0;
  let soloCrossCountry = 0;
  let soloCcts = 0;
  let soloGft = 0;
  let soloMultiChecks = 0;
  let soloNight = 0;
  let dualTotal = 0;
  let dualIf = 0;
  let dualMulti = 0;
  let dualNight = 0;
  let dualExtra = 0;

  for (const row of rows) {
    const capacity = normalizeCapacity(row);
    const picBreakdown = picBreakdownMinutesFromRow(row);

    if (isSoloPicCapacity(capacity)) {
      const breakdown = picBreakdownMinutesForRow(row);
      const block = rowBlock(row);
      soloPicTotal += breakdown > 0 ? breakdown : capacity === 'solo' ? block : picMinutesForRow(row);

      if (capacity === 'pic') {
        soloCrossCountry += soloPicCrossCountryMinutes(row);
        soloCcts += (picBreakdown.cctsDay || 0) + (picBreakdown.cctsNight || 0);
        soloGft +=
          (picBreakdown.gft300nm || 0) +
          (picBreakdown.gft250nm || 0) +
          (picBreakdown.gft120nm || 0) +
          (picBreakdown.gftDay || 0) +
          (picBreakdown.gftNight || 0);
        soloMultiChecks +=
          (picBreakdown.multiDay || 0) +
          (picBreakdown.multiNight || 0) +
          (picBreakdown.multiIrt || 0);
        soloNight += picBreakdown.nightCategory || 0;
      }
    }

    if (isDualCapacity(capacity)) {
      dualTotal += dualMinutesForRow(row);
      dualIf += row.dual_if_minutes || 0;
      dualMulti += row.dual_multi_minutes || 0;
      dualNight += row.dual_night_minutes || 0;
      dualExtra += row.dual_extra_minutes || 0;
    }
  }

  return {
    soloPic: {
      total: soloPicTotal,
      crossCountry: soloCrossCountry,
      ccts: soloCcts,
      gft: soloGft,
      multiChecks: soloMultiChecks,
      night: soloNight,
    },
    dual: {
      total: dualTotal,
      instrument: dualIf,
      multi: dualMulti,
      night: dualNight,
      extra: dualExtra,
    },
  };
}

export async function fetchCareerTotals(userId: string) {
  return supabase
    .from('flights')
    .select(
      'block_time_minutes,pic_time_minutes,sic_time_minutes,night_time_minutes,instrument_time_minutes,instrument_timings_minutes,ifr_actual_minutes,ifr_simulated_minutes,operating_capacity,is_cross_country,cross_country_total_minutes,aircraft_type,dual_extra_minutes,dual_night_minutes,dual_if_minutes,dual_multi_minutes,pic_ccts_day_minutes,pic_ccts_night_minutes,pic_xcty_minutes,pic_night_category_minutes,pic_gft_300nm_minutes,pic_gft_250nm_minutes,pic_gft_120nm_minutes,pic_gft_day_minutes,pic_gft_night_minutes,pic_multi_day_minutes,pic_multi_night_minutes,pic_multi_irt_minutes'
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

/** Sum of stored PIC child fields when present. */
export function picBreakdownMinutesForRow(row: FlightTotalsRow) {
  const detailed = sumPicBreakdownMinutes(picBreakdownMinutesFromRow(row));
  if (detailed > 0) return detailed;

  return (
    (row.pic_extra_minutes || 0) +
    (row.pic_night_minutes || 0) +
    (row.pic_if_minutes || 0) +
    (row.pic_multi_minutes || 0)
  );
}

/** Sum of stored dual child fields when present. */
export function dualBreakdownMinutesForRow(row: FlightTotalsRow) {
  return (
    (row.dual_extra_minutes || 0) +
    (row.dual_night_minutes || 0) +
    (row.dual_if_minutes || 0) +
    (row.dual_multi_minutes || 0)
  );
}

/** PIC hours for home/career when legacy rows lack pic_time_minutes. */
export function picMinutesForRow(row: FlightTotalsRow) {
  const breakdown = picBreakdownMinutesForRow(row);
  if (breakdown > 0) return breakdown;

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
  const breakdown = dualBreakdownMinutesForRow(row);
  if (breakdown > 0) return breakdown;

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
  const picMinutes = picBreakdownMinutesFromRow(row);
  const breakdownNight =
    (picMinutes.nightCategory || 0) +
    (picMinutes.gftNight || 0) +
    (picMinutes.cctsNight || 0) +
    (picMinutes.multiNight || 0) +
    (row.dual_night_minutes || 0);
  if (breakdownNight > 0) return breakdownNight;
  return row.night_time_minutes || 0;
}

function rowCrossCountry(row: FlightTotalsRow) {
  let total = 0;
  if ((row.cross_country_total_minutes || 0) > 0) {
    total += row.cross_country_total_minutes || 0;
  } else if (row.is_cross_country) {
    total += rowBlock(row);
  }
  total += picCrossCountryMinutesFromRow(row);
  return total;
}

function rowInstrument(row: FlightTotalsRow) {
  const picMinutes = picBreakdownMinutesFromRow(row);
  const breakdownIf = (picMinutes.multiIrt || 0) + (row.dual_if_minutes || 0);
  if (breakdownIf > 0) return breakdownIf;

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
  let dualExtra = 0;
  let dualNight = 0;
  let dualIf = 0;
  let dualMulti = 0;
  let picCctsDay = 0;
  let picCctsNight = 0;
  let picXcty = 0;
  let picNightCategory = 0;
  let picGft300 = 0;
  let picGft250 = 0;
  let picGft120 = 0;
  let picGftDay = 0;
  let picGftNight = 0;
  let picMultiDay = 0;
  let picMultiNight = 0;
  let picMultiIrt = 0;

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
      ifDual += row.dual_if_minutes || Math.min(instrument, block);
    } else if (capacity === 'pic') {
      const breakdown = picBreakdownMinutesForRow(row);
      soloPic += breakdown > 0 ? breakdown : pic > 0 ? pic : block;
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
    } else if (capacity === 'p1u_s') {
      generalFlying += block;
    }

    const picBreakdown = picBreakdownMinutesFromRow(row);
    const picBreakdownTotal = sumPicBreakdownMinutes(picBreakdown);

    picCctsDay += picBreakdown.cctsDay || 0;
    picCctsNight += picBreakdown.cctsNight || 0;
    picXcty += picBreakdown.xcty || 0;
    picNightCategory += picBreakdown.nightCategory || 0;
    picGft300 += picBreakdown.gft300nm || 0;
    picGft250 += picBreakdown.gft250nm || 0;
    picGft120 += picBreakdown.gft120nm || 0;
    picGftDay += picBreakdown.gftDay || 0;
    picGftNight += picBreakdown.gftNight || 0;
    picMultiDay += picBreakdown.multiDay || 0;
    picMultiNight += picBreakdown.multiNight || 0;
    picMultiIrt += picBreakdown.multiIrt || 0;

    picTotal += pic;
    if (xc > 0) picXc += pic > 0 ? Math.min(pic, xc) : xc;

    const aircraftSplit = splitPicByAircraft(pic, row);
    pic250 += aircraftSplit.hour250;
    pic120 += aircraftSplit.hour120;

    if (picBreakdownTotal > 0) {
      gftDay += picBreakdown.gftDay || 0;
      gftNight += picBreakdown.gftNight || 0;
      gftIrt += picBreakdown.multiIrt || 0;
    } else {
      const picNight = Math.min(pic, night);
      const picDay = Math.max(pic - picNight, 0);
      gftDay += picDay;
      gftNight += picNight;
      gftIrt += Math.min(instrument, pic);
      if (capacity === 'solo') gftNightPic += picNight;
    }

    if (capacity === 'dual' || dualBreakdownMinutesForRow(row) > 0) {
      dualExtra += row.dual_extra_minutes || 0;
      dualNight += row.dual_night_minutes || 0;
      dualIf += row.dual_if_minutes || 0;
      dualMulti += row.dual_multi_minutes || 0;
    }
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
      breakdown: {
        cctsDay: picCctsDay,
        cctsNight: picCctsNight,
        xcty: picXcty,
        night: picNightCategory,
        gft300nm: picGft300,
        gft250nm: picGft250,
        gft120nm: picGft120,
        gftDay: picGftDay,
        gftNight: picGftNight,
        multiDay: picMultiDay,
        multiNight: picMultiNight,
        multiIrt: picMultiIrt,
      },
    },
    instrumentBreakdown: {
      total: ifTotal,
      ifActual,
      ifDual,
    },
    dualBreakdown: {
      total: dualExtra + dualNight + dualIf + dualMulti,
      extra: dualExtra,
      night: dualNight,
      instrument: dualIf,
      multi: dualMulti,
    },
    hourSummary: aggregateHourSummaryColumns(rows),
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
  const crossCountry = rows.reduce((acc, row) => acc + rowCrossCountry(row), 0);
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
