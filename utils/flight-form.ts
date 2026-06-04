import { supabase } from '@/utils/supabase';
import {
  parsePicBreakdownMinutes,
  picBreakdownToDbPayload,
  sumPicBreakdownMinutes,
  type PicBreakdownFormState,
} from '@/utils/pic-breakdown';

export type LastFlightDefaults = {
  flight_number: string | null;
  aircraft_registration: string | null;
  aircraft_type: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  operating_capacity: string | null;
  pic_name: string | null;
  co_pilot_name: string | null;
  takeoffs: number | null;
  landings: number | null;
  go_arounds: number | null;
};

export type FlightSaveInput = {
  date: string;
  flightNo: string;
  registration: string;
  aircraftType: string;
  from: string;
  to: string;
  operatingCapacity: string;
  outTime: string;
  inTime: string;
  picName: string;
  coPilotName: string;
  crossCountryTotal: string;
  routePoints: string;
  distance: string;
  remarks: string;
  signature: string;
  takeoffs: string;
  landings: string;
  goArounds: string;
  dualExtraEnabled: boolean;
  dualExtraTime: string;
  dualNightEnabled: boolean;
  dualNightTime: string;
  dualIfEnabled: boolean;
  dualIfTime: string;
  dualMultiEnabled: boolean;
  dualMultiTime: string;
  picBreakdown: PicBreakdownFormState;
};

export type DualBreakdownMinutes = {
  extra: number | null;
  night: number | null;
  instrument: number | null;
  multi: number | null;
};

export function parseDualBreakdownMinutes(input: FlightSaveInput): DualBreakdownMinutes {
  return {
    extra: input.dualExtraEnabled ? toMinutes(input.dualExtraTime) : null,
    night: input.dualNightEnabled ? toMinutes(input.dualNightTime) : null,
    instrument: input.dualIfEnabled ? toMinutes(input.dualIfTime) : null,
    multi: input.dualMultiEnabled ? toMinutes(input.dualMultiTime) : null,
  };
}

export function sumDualBreakdownMinutes(breakdown: DualBreakdownMinutes) {
  return (
    (breakdown.extra || 0) +
    (breakdown.night || 0) +
    (breakdown.instrument || 0) +
    (breakdown.multi || 0)
  );
}

/** True when any enabled dual child duration exceeds block time from Out/In. */
export function dualBreakdownExceedsBlockTime(input: FlightSaveInput, outTime: string, inTime: string) {
  const blockMinutes = blockMinutesFromOutIn(outTime, inTime);
  if (blockMinutes === null) return false;
  const breakdown = parseDualBreakdownMinutes(input);
  return Object.values(breakdown).some((minutes) => minutes !== null && minutes > blockMinutes);
}

/** True when enabled dual children sum to more than block time. */
export function dualBreakdownSumExceedsBlockTime(input: FlightSaveInput, outTime: string, inTime: string) {
  const blockMinutes = blockMinutesFromOutIn(outTime, inTime);
  if (blockMinutes === null) return false;
  const breakdown = parseDualBreakdownMinutes(input);
  const total = sumDualBreakdownMinutes(breakdown);
  return total > blockMinutes;
}

export function formatDateISO(dateValue: Date) {
  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, '0');
  const d = String(dateValue.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toMinutes(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length === 3) {
    const h = Number(digits[0]);
    const m = Number(digits.slice(1));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
  if (digits.length === 4) {
    const h = Number(digits.slice(0, 2));
    const m = Number(digits.slice(2));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  const [h, m] = trimmed.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function minutesToHHMM(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeFromDb(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 5);
}

/** Normalize user input to Postgres `time` (HH:MM:SS). */
export function normalizeTimeForDb(value: string): string | null {
  const minutes = toMinutes(value);
  if (minutes === null || minutes < 0 || minutes >= 24 * 60) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export function blockMinutesFromOutIn(outTime: string, inTime: string) {
  const out = toMinutes(outTime);
  const input = toMinutes(inTime);
  if (out === null || input === null) return null;
  return input >= out ? input - out : 24 * 60 - out + input;
}

/** True when Out/In entry is finished (4-digit compact or full HH:MM). Used for auto-focus only. */
export function isCompleteTimeEntry(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes(':')) {
    return /^\d{1,2}:\d{2}$/.test(trimmed) && toMinutes(trimmed) !== null;
  }
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length === 4) {
    return toMinutes(trimmed) !== null;
  }
  return false;
}

/** True when night duration exceeds block time from Out/In. */
export function nightExceedsBlockTime(night: string, outTime: string, inTime: string) {
  const nightMinutes = toMinutes(night);
  if (nightMinutes === null || nightMinutes <= 0) return false;
  const blockMinutes = blockMinutesFromOutIn(outTime, inTime);
  if (blockMinutes === null) return true;
  return nightMinutes > blockMinutes;
}

export function parseCount(value: string, fallback = 0) {
  const parsed = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
}

/** Map block time to PIC / SIC columns from operating capacity (matches CSV import semantics). */
export function deriveRoleTimeMinutes(
  blockMinutes: number | null,
  operatingCapacity: string
): { pic_time_minutes: number | null; sic_time_minutes: number | null } {
  if (blockMinutes === null || blockMinutes <= 0) {
    return { pic_time_minutes: null, sic_time_minutes: null };
  }

  const capacity = operatingCapacity.trim().toLowerCase();

  switch (capacity) {
    case 'dual':
      return { pic_time_minutes: null, sic_time_minutes: blockMinutes };
    case 'pic':
    case 'solo':
    case 'p1u_s':
    case 'examiner':
    case 'instructor':
      return { pic_time_minutes: blockMinutes, sic_time_minutes: null };
    case 'copilot':
    case 'observer':
    case 'relief':
      return { pic_time_minutes: null, sic_time_minutes: blockMinutes };
    default:
      return { pic_time_minutes: null, sic_time_minutes: null };
  }
}

export function buildFlightSavePayload(input: FlightSaveInput): Record<string, unknown> {
  const blockMinutes = blockMinutesFromOutIn(input.outTime, input.inTime);
  const capacity = input.operatingCapacity.trim().toLowerCase();
  const roleTimes = deriveRoleTimeMinutes(blockMinutes, capacity);
  const dualBreakdown = parseDualBreakdownMinutes(input);
  const dualBreakdownTotal = sumDualBreakdownMinutes(dualBreakdown);
  const picBreakdown = parsePicBreakdownMinutes(input.picBreakdown);
  const picBreakdownTotal = sumPicBreakdownMinutes(picBreakdown);
  const crossCountryMinutes = toMinutes(input.crossCountryTotal);

  const sicTimeMinutes =
    dualBreakdownTotal > 0
      ? dualBreakdownTotal
      : capacity === 'dual' || ['copilot', 'observer', 'relief'].includes(capacity)
        ? roleTimes.sic_time_minutes
        : null;

  const picTimeMinutes =
    picBreakdownTotal > 0
      ? picBreakdownTotal
      : capacity === 'pic' ||
          capacity === 'solo' ||
          capacity === 'p1u_s' ||
          capacity === 'examiner' ||
          capacity === 'instructor'
        ? roleTimes.pic_time_minutes
        : null;

  const nightMinutes =
    picBreakdown.nightCategory ||
    picBreakdown.gftNight ||
    picBreakdown.cctsNight ||
    picBreakdown.multiNight ||
    dualBreakdown.night;

  const instrumentMinutes =
    picBreakdown.multiIrt || dualBreakdown.instrument;

  return {
    flight_date: input.date.trim(),
    flight_number: input.flightNo.trim() || null,
    aircraft_type: input.aircraftType.trim() || null,
    aircraft_registration: input.registration.trim(),
    origin_iata: input.from.trim().toUpperCase(),
    destination_iata: input.to.trim().toUpperCase(),
    block_time_minutes: blockMinutes,
    total_time_minutes: blockMinutes,
    night_time_minutes: nightMinutes,
    instrument_time_minutes: instrumentMinutes,
    instrument_timings_minutes: instrumentMinutes,
    ifr_actual_minutes: instrumentMinutes,
    ifr_simulated_minutes: null,
    cross_country_total_minutes: crossCountryMinutes,
    operating_capacity: capacity || null,
    pic_time_minutes: picTimeMinutes,
    sic_time_minutes: sicTimeMinutes,
    dual_extra_minutes: dualBreakdown.extra,
    dual_night_minutes: dualBreakdown.night,
    dual_if_minutes: dualBreakdown.instrument,
    dual_multi_minutes: dualBreakdown.multi,
    ...picBreakdownToDbPayload(picBreakdown),
    pic_name: input.picName.trim() || null,
    co_pilot_name: input.coPilotName.trim() || null,
    out_time: normalizeTimeForDb(input.outTime),
    in_time: normalizeTimeForDb(input.inTime),
    route_points: input.routePoints.trim() || null,
    distance_nm: input.distance.trim() ? Number(input.distance) : null,
    remarks: input.remarks.trim() || null,
    signature_url: input.signature.trim() || null,
    takeoffs: parseCount(input.takeoffs, 1),
    landings: parseCount(input.landings, 1),
    go_arounds: parseCount(input.goArounds, 0),
    is_cross_country:
      (crossCountryMinutes || 0) > 0 ||
      (picBreakdown.xcty || 0) > 0 ||
      (picBreakdown.gft300nm || 0) > 0,
    pf_takeoff_landing: false,
    stl: false,
    multi_crew: false,
    ulr_ops: false,
  };
}

export async function fetchLastFlightDefaults(userId: string) {
  return supabase
    .from('flights')
    .select(
      'flight_number, aircraft_registration, aircraft_type, origin_iata, destination_iata, operating_capacity, pic_name, co_pilot_name, takeoffs, landings, go_arounds'
    )
    .eq('user_id', userId)
    .order('flight_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<LastFlightDefaults>();
}
