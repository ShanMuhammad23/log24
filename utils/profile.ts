import { createSupabaseClient } from '@/utils/supabase';

export const RANK_OPTIONS = [
  { label: 'Captain', value: 'captain' },
  { label: 'First Officer', value: 'first_officer' },
  { label: 'Student Pilot', value: 'student_pilot' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Examiner', value: 'examiner' },
] as const;

export const DEFAULT_CAPACITY_OPTIONS = [
  { label: 'PIC', value: 'pic' },
  { label: 'CoPilot', value: 'copilot' },
  { label: 'DUAL', value: 'dual' },
  { label: 'P1U/S', value: 'p1u_s' },
  { label: 'Solo', value: 'solo' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Examiner', value: 'examiner' },
  { label: 'Observer', value: 'observer' },
  { label: 'Relief', value: 'relief' },
] as const;

export const LICENSE_TYPE_OPTIONS = [
  { label: 'ATPL', value: 'atpl' },
  { label: 'CPL', value: 'cpl' },
  { label: 'PPL', value: 'ppl' },
  { label: 'SPL', value: 'spl' },
] as const;

export type Rank = (typeof RANK_OPTIONS)[number]['value'];
export type DefaultCapacity = (typeof DEFAULT_CAPACITY_OPTIONS)[number]['value'];
export type LicenseType = (typeof LICENSE_TYPE_OPTIONS)[number]['value'];

export type ProfileRecord = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  rank: Rank | null;
  default_operating_capacity: DefaultCapacity | null;
  organization: string | null;
  license_type: LicenseType | null;
  license_number: string | null;
  country: string | null;
};

export type UpsertProfileInput = Omit<ProfileRecord, 'email'> & {
  email?: string | null;
};

const PROFILE_SELECT = `
  user_id,
  email,
  full_name,
  rank,
  default_operating_capacity,
  organization,
  license_type,
  license_number,
  country
`;

export async function getProfile(userId: string) {
  return createSupabaseClient()
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('user_id', userId)
    .maybeSingle<ProfileRecord>();
}

export async function upsertProfile(payload: UpsertProfileInput) {
  return createSupabaseClient()
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select(PROFILE_SELECT)
    .single<ProfileRecord>();
}

export function toLabel(
  value: string | null | undefined,
  options: readonly { label: string; value: string }[]
) {
  if (!value) return '-';
  return options.find((option) => option.value === value)?.label ?? value;
}
