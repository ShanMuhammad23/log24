import type { ProfileRecord } from '@/utils/profile';

export const RECENCY_PERIOD_DAYS = 15;
/** Show banner once this many full days have passed since the last flight. */
export const RECENCY_ALERT_AFTER_DAYS = 6;
/** Show blocking modal when fewer than this many days remain in the period. */
export const RECENCY_MODAL_WHEN_DAYS_LEFT_BELOW = 5;

export type RecencyStatus = {
  daysSinceLastFlight: number;
  daysRemaining: number;
  showAlert: boolean;
  showModal: boolean;
};

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysSinceDate(dateInput: string | Date, referenceDate = new Date()) {
  const flightDay = startOfLocalDay(typeof dateInput === 'string' ? new Date(dateInput) : dateInput);
  const today = startOfLocalDay(referenceDate);
  return Math.floor((today.getTime() - flightDay.getTime()) / (1000 * 60 * 60 * 24));
}

export function isCplStudentPilot(profile: Pick<ProfileRecord, 'rank' | 'license_type'> | null | undefined) {
  return profile?.rank === 'student_pilot' && profile?.license_type === 'cpl';
}

export function getRecencyStatus(lastFlightDate: string | null | undefined): RecencyStatus | null {
  if (!lastFlightDate) return null;

  const daysSinceLastFlight = daysSinceDate(lastFlightDate);
  const daysRemaining = Math.max(0, RECENCY_PERIOD_DAYS - daysSinceLastFlight);
  const showAlert = daysSinceLastFlight >= RECENCY_ALERT_AFTER_DAYS;

  return {
    daysSinceLastFlight,
    daysRemaining,
    showAlert,
    showModal: showAlert && daysRemaining < RECENCY_MODAL_WHEN_DAYS_LEFT_BELOW,
  };
}
