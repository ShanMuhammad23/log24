import { supabase } from '@/utils/supabase';

export const FLIGHT_FIELD_TYPES = [
  'flight_number',
  'aircraft_registration',
  'aircraft_type',
  'pic_name',
  'co_pilot_name',
] as const;

export type FlightFieldType = (typeof FLIGHT_FIELD_TYPES)[number];

export type FlightFieldPresetsMap = Record<FlightFieldType, string[]>;

const EMPTY_PRESETS: FlightFieldPresetsMap = {
  flight_number: [],
  aircraft_registration: [],
  aircraft_type: [],
  pic_name: [],
  co_pilot_name: [],
};

export function emptyFlightFieldPresets(): FlightFieldPresetsMap {
  return { ...EMPTY_PRESETS };
}

/** Case-insensitive unique preset values (fixes duplicate dropdown entries). */
export function dedupePresetOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const option of options) {
    const trimmed = option.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function filterPresetOptions(options: string[], query: string): string[] {
  const deduped = dedupePresetOptions(options);
  const q = query.trim().toLowerCase();
  if (!q) return deduped;
  return deduped.filter((option) => option.toLowerCase().includes(q));
}

export async function fetchFlightFieldPresets(userId: string): Promise<FlightFieldPresetsMap> {
  const { data, error } = await supabase
    .from('flight_field_presets')
    .select('field_type, value')
    .eq('user_id', userId)
    .order('value', { ascending: true });

  if (error || !data) {
    return emptyFlightFieldPresets();
  }

  const grouped = emptyFlightFieldPresets();
  for (const row of data) {
    const fieldType = row.field_type as FlightFieldType;
    if (!FLIGHT_FIELD_TYPES.includes(fieldType)) continue;
    const value = (row.value || '').trim();
    if (!value) continue;
    grouped[fieldType].push(value);
  }
  for (const fieldType of FLIGHT_FIELD_TYPES) {
    grouped[fieldType] = dedupePresetOptions(grouped[fieldType]);
  }
  return grouped;
}

export async function addFlightFieldPreset(
  userId: string,
  fieldType: FlightFieldType,
  value: string
): Promise<{ value: string; error: string | null }> {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: '', error: 'Value cannot be empty.' };
  }

  const { error } = await supabase.from('flight_field_presets').upsert(
    {
      user_id: userId,
      field_type: fieldType,
      value: trimmed,
    },
    { onConflict: 'user_id,field_type,value', ignoreDuplicates: false }
  );

  if (error) {
    return { value: trimmed, error: error.message };
  }

  return { value: trimmed, error: null };
}

export async function syncFlightFieldPresetsFromForm(
  userId: string,
  values: Partial<Record<FlightFieldType, string | null | undefined>>
): Promise<void> {
  const tasks = FLIGHT_FIELD_TYPES.map((fieldType) => {
    const raw = values[fieldType];
    const trimmed = (raw || '').trim();
    if (!trimmed) return Promise.resolve();
    return addFlightFieldPreset(userId, fieldType, trimmed).then(() => undefined);
  });
  await Promise.all(tasks);
}

export function mergePresetOption(options: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return dedupePresetOptions(options);
  const exists = options.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  if (exists) return dedupePresetOptions(options);
  return dedupePresetOptions([trimmed, ...options]);
}
