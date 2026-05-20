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

export const ORGANIZATION_OPTIONS = [
  { label: 'Avyanna Aviation Pvt. Ltd', value: 'Avyanna Aviation Pvt. Ltd' },
  { label: 'Academy of Carver Aviation', value: 'Academy of Carver Aviation' },
  { label: 'FSTC Flying School Pvt. Ltd', value: 'FSTC Flying School Pvt. Ltd' },
  { label: 'National Flying Training Institute Pvt. Ltd', value: 'National Flying Training Institute Pvt. Ltd' },
  { label: 'Indira Gandhi Rashtriya Uran Akademi', value: 'Indira Gandhi Rashtriya Uran Akademi' },
  { label: 'Flytech Aviation Academy', value: 'Flytech Aviation Academy' },
  { label: 'Skynex Aero Pvt. Ltd', value: 'Skynex Aero Pvt. Ltd' },
  { label: 'Garg Aviation Ltd', value: 'Garg Aviation Ltd' },
  { label: 'Chetak Aviation Pvt. Ltd', value: 'Chetak Aviation Pvt. Ltd' },
  { label: 'Chimes Aviation Academy', value: 'Chimes Aviation Academy' },
  { label: 'Dunes Aviation Academy', value: 'Dunes Aviation Academy' },
  { label: 'Ekvi Air Training Organisation Pvt. Ltd', value: 'Ekvi Air Training Organisation Pvt. Ltd' },
  { label: 'Jet Serve Aviation Pvt. Ltd', value: 'Jet Serve Aviation Pvt. Ltd' },
  { label: 'Alchemist Aviation Pvt. Ltd', value: 'Alchemist Aviation Pvt. Ltd' },
  { label: 'Ambition Flying Club', value: 'Ambition Flying Club' },
  { label: 'Orient Flight Aviation Academy', value: 'Orient Flight Aviation Academy' },
  { label: 'The Bombay Flying Club', value: 'The Bombay Flying Club' },
  { label: 'The Gujarat Flying Club', value: 'The Gujarat Flying Club' },
  { label: 'Sha Shib Flying Academy', value: 'Sha Shib Flying Academy' },
  { label: 'Indian Flying Academy', value: 'Indian Flying Academy' },
  { label: 'The Madhya Pradesh Flying Club', value: 'The Madhya Pradesh Flying Club' },
  { label: 'Wings Aviation Pvt Ltd', value: 'Wings Aviation Pvt Ltd' },
  { label: 'Asia Pacific Training Academy', value: 'Asia Pacific Training Academy' },
  { label: 'Haryana Institute of Civil Aviation', value: 'Haryana Institute of Civil Aviation' },
  { label: 'Rajiv Gandhi Academy for Aviation Technology', value: 'Rajiv Gandhi Academy for Aviation Technology' },
  { label: 'Telangana State Aviation Academy', value: 'Telangana State Aviation Academy' },
  { label: 'Nagpur Flying Club', value: 'Nagpur Flying Club' },
  { label: 'Banasthali Vidyapith Gliding & Flying Club', value: 'Banasthali Vidyapith Gliding & Flying Club' },
  { label: 'Bihar Flying Institute', value: 'Bihar Flying Institute' },
  { label: 'Patiala Aviation Club', value: 'Patiala Aviation Club' },
  { label: 'SVKM NMIMS Academy of Aviation', value: 'SVKM NMIMS Academy of Aviation' },
  { label: 'BlueRay Aviation Pvt Ltd', value: 'BlueRay Aviation Pvt Ltd' },
  { label: 'Pioneer Flying Club Academy Pvt Ltd', value: 'Pioneer Flying Club Academy Pvt Ltd' },
  { label: 'Govt. Aviation Training Institute', value: 'Govt. Aviation Training Institute' },
  { label: 'Redbird Flight Training Academy Pvt Ltd', value: 'Redbird Flight Training Academy Pvt Ltd' },
] as const;

export type Rank = (typeof RANK_OPTIONS)[number]['value'];
export type DefaultCapacity = (typeof DEFAULT_CAPACITY_OPTIONS)[number]['value'];
export type LicenseType = (typeof LICENSE_TYPE_OPTIONS)[number]['value'];

export type ProfileRecord = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  rank: Rank | null;
  onboarding_shown: boolean | null;
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
  onboarding_shown,
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

export function filterOrganizationOptions(query: string, maxResults = 20) {
  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? ORGANIZATION_OPTIONS.filter((option) => option.label.toLowerCase().includes(normalized))
    : [...ORGANIZATION_OPTIONS];
  return matches.slice(0, maxResults);
}
