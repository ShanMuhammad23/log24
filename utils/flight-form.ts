import { supabase } from '@/utils/supabase';

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
  night: string;
  ifrActual: string;
  crossCountryTotal: string;
  instrumentTimings: string;
  ifrSimulated: string;
  routePoints: string;
  distance: string;
  remarks: string;
  signature: string;
  takeoffs: string;
  landings: string;
  goArounds: string;
  isCrossCountry: boolean;
  pfTakeoffLanding: boolean;
  stl: boolean;
  multiCrew: boolean;
  ulrOps: boolean;
};

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

export function parseCount(value: string, fallback = 0) {
  const parsed = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function buildFlightSavePayload(input: FlightSaveInput): Record<string, unknown> {
  const blockMinutes = blockMinutesFromOutIn(input.outTime, input.inTime);
  const nightMinutes = toMinutes(input.night);
  const instrumentTimingsMinutes = toMinutes(input.instrumentTimings);
  const ifrActualMinutes = toMinutes(input.ifrActual);
  const ifrSimulatedMinutes = toMinutes(input.ifrSimulated);
  const crossCountryMinutes = toMinutes(input.crossCountryTotal);

  return {
    flight_date: input.date.trim(),
    flight_number: input.flightNo.trim() || null,
    aircraft_type: input.aircraftType.trim(),
    aircraft_registration: input.registration.trim(),
    origin_iata: input.from.trim().toUpperCase(),
    destination_iata: input.to.trim().toUpperCase(),
    block_time_minutes: blockMinutes,
    total_time_minutes: blockMinutes,
    night_time_minutes: nightMinutes,
    instrument_time_minutes: instrumentTimingsMinutes,
    instrument_timings_minutes: instrumentTimingsMinutes,
    ifr_actual_minutes: ifrActualMinutes,
    ifr_simulated_minutes: ifrSimulatedMinutes,
    cross_country_total_minutes: crossCountryMinutes,
    operating_capacity: input.operatingCapacity,
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
    is_cross_country: input.isCrossCountry,
    pf_takeoff_landing: input.pfTakeoffLanding,
    stl: input.stl,
    multi_crew: input.multiCrew,
    ulr_ops: input.ulrOps,
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
