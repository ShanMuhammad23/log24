import { supabase } from '@/utils/supabase';

export type AirportOption = {
  iata: string | null;
  icao: string;
  name: string;
  city: string | null;
};

export const AIRPORT_SEARCH_LIMIT = 20;
export const AIRPORT_SEARCH_MIN_CHARS = 2;

/** Code stored on flights (IATA preferred, else ICAO). */
export function airportStorageCode(airport: AirportOption): string {
  const iata = (airport.iata || '').trim();
  if (iata) return iata.toUpperCase();
  return (airport.icao || '').trim().toUpperCase();
}

export function airportLabel(airport: AirportOption): string {
  const code = airportStorageCode(airport);
  const icao = (airport.icao || '').trim().toUpperCase();
  const showIcao = icao && icao !== code;
  const location = [airport.name, airport.city].filter(Boolean).join(', ');
  const codePart = showIcao ? `${code} (${icao})` : code;
  return location ? `${codePart} — ${location}` : codePart;
}

function normalizeRow(row: {
  iata?: string | null;
  icao?: string | null;
  name?: string | null;
  city?: string | null;
}): AirportOption | null {
  const icao = (row.icao || '').trim();
  const name = (row.name || '').trim();
  if (!icao || !name) return null;
  return {
    iata: (row.iata || '').trim() || null,
    icao,
    name,
    city: (row.city || '').trim() || null,
  };
}

export function dedupeAirports(airports: AirportOption[]): AirportOption[] {
  const seen = new Set<string>();
  const out: AirportOption[] = [];
  for (const airport of airports) {
    const key = (airport.icao || airport.iata || '').toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(airport);
  }
  return out;
}

export function filterUserAirports(airports: AirportOption[], query: string): AirportOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return airports.slice(0, AIRPORT_SEARCH_LIMIT);
  return airports
    .filter((a) => {
      const hay = [a.icao, a.iata, a.name, a.city].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    })
    .slice(0, AIRPORT_SEARCH_LIMIT);
}

export async function fetchUserSavedAirports(userId: string, limit = AIRPORT_SEARCH_LIMIT): Promise<AirportOption[]> {
  const { data, error } = await supabase
    .from('user_saved_airports')
    .select('iata, icao, name, city')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return dedupeAirports(data.map(normalizeRow).filter((a): a is AirportOption => a !== null));
}

export async function searchGlobalAirports(query: string, limit = AIRPORT_SEARCH_LIMIT): Promise<AirportOption[]> {
  const q = query.trim();
  if (q.length < AIRPORT_SEARCH_MIN_CHARS) return [];

  const { data, error } = await supabase.rpc('search_airports', {
    search_query: q,
    result_limit: limit,
  });

  if (error) {
    const pattern = `%${q}%`;
    const fallback = await supabase
      .from('airports')
      .select('iata, icao, name, city')
      .or(`icao.ilike.${pattern},iata.ilike.${pattern},name.ilike.${pattern},city.ilike.${pattern}`)
      .limit(limit);

    if (fallback.error || !fallback.data) return [];
    return dedupeAirports(fallback.data.map(normalizeRow).filter((a): a is AirportOption => a !== null));
  }

  return dedupeAirports((data || []).map(normalizeRow).filter((a): a is AirportOption => a !== null));
}

export async function searchAirportsCombined(
  userId: string,
  query: string,
  savedAirports: AirportOption[]
): Promise<{ saved: AirportOption[]; global: AirportOption[] }> {
  const q = query.trim();
  const saved = filterUserAirports(savedAirports, q);

  if (q.length < AIRPORT_SEARCH_MIN_CHARS) {
    return { saved, global: [] };
  }

  const global = await searchGlobalAirports(q);
  const savedKeys = new Set(saved.map((a) => a.icao.toUpperCase()));
  const globalFiltered = global.filter((a) => !savedKeys.has(a.icao.toUpperCase())).slice(0, AIRPORT_SEARCH_LIMIT);

  return { saved, global: globalFiltered };
}

export async function addUserSavedAirport(
  userId: string,
  airport: AirportOption
): Promise<{ airport: AirportOption; error: string | null }> {
  const icao = (airport.icao || '').trim().toUpperCase();
  const name = (airport.name || '').trim();
  if (!icao || !name) {
    return { airport, error: 'ICAO and airport name are required.' };
  }

  const payload = {
    user_id: userId,
    iata: (airport.iata || '').trim().toUpperCase() || null,
    icao,
    name,
    city: (airport.city || '').trim() || null,
  };

  const { error } = await supabase.from('user_saved_airports').upsert(payload, {
    onConflict: 'user_id,icao',
    ignoreDuplicates: false,
  });

  if (error) {
    return { airport: { ...airport, icao, name }, error: error.message };
  }

  return { airport: { ...airport, icao, name, iata: payload.iata }, error: null };
}

export async function lookupAirportByCode(code: string): Promise<AirportOption | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;

  const { data, error } = await supabase
    .from('airports')
    .select('iata, icao, name, city')
    .or(`icao.eq.${c},iata.eq.${c}`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeRow(data);
}

export async function saveUserAirportByCode(userId: string, code: string): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) return;

  const found = await lookupAirportByCode(trimmed);
  if (found) {
    await addUserSavedAirport(userId, found);
    return;
  }

  const upper = trimmed.toUpperCase();
  await addUserSavedAirport(userId, {
    iata: upper.length === 3 ? upper : null,
    icao: upper.length === 4 ? upper : upper,
    name: upper,
    city: null,
  });
}

export function mergeSavedAirport(list: AirportOption[], airport: AirportOption): AirportOption[] {
  const icao = airport.icao.toUpperCase();
  const without = list.filter((a) => a.icao.toUpperCase() !== icao);
  return [airport, ...without].slice(0, 100);
}
