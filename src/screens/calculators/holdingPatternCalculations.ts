import type { EntryType, HoldCourseMode, HoldSide, HoldingPatternResult } from './types';
import { parseNum, toDeg, toRad } from './utils';

/** Wind correction angle (°) for a given course. */
export function windCorrectionAngle(course: number, tas: number, windDir: number, windSpeed: number): number | null {
  if (tas <= 0) return null;
  const ratio = (windSpeed * Math.sin(toRad(windDir - course))) / tas;
  if (Math.abs(ratio) > 1) return null;
  return toDeg(Math.asin(ratio));
}

export function reciprocal(course: number): number {
  return (course + 180) % 360;
}

export function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function inboundFromHoldInput(holdCourse: number, mode: HoldCourseMode): number {
  return mode === 'Inbound' ? normalizeHeading(holdCourse) : reciprocal(holdCourse);
}

/** FAA recommended holding entry from aircraft heading vs inbound course. */
export function determineEntry(angle: number, holdSide: HoldSide): EntryType {
  const normalized = normalizeHeading(angle);
  if (holdSide === 'Right') {
    if (normalized <= 70 || normalized >= 310) return 'Direct';
    if (normalized > 70 && normalized <= 130) return 'Teardrop';
    return 'Parallel';
  }
  if (normalized >= 230 && normalized <= 290) return 'Direct';
  if (normalized > 170 && normalized < 230) return 'Teardrop';
  return 'Parallel';
}

export function calculateHoldingPattern(
  aircraftHeading: number,
  holdCourse: number,
  holdCourseMode: HoldCourseMode,
  holdSide: HoldSide,
  tas: number,
  windDir: number,
  windSpeed: number
): HoldingPatternResult | null {
  const inboundCourse = inboundFromHoldInput(holdCourse, holdCourseMode);
  const outboundCourse = reciprocal(inboundCourse);

  const inboundWca = windCorrectionAngle(inboundCourse, tas, windDir, windSpeed);
  if (inboundWca === null) return null;

  const inboundHeading = normalizeHeading(inboundCourse + inboundWca);
  // Standard holding: triple inbound correction, opposite sign on outbound leg.
  const outboundHeading = normalizeHeading(outboundCourse - 3 * inboundWca);

  const entryAngle = normalizeHeading(aircraftHeading - inboundCourse);
  const entryType = determineEntry(entryAngle, holdSide);

  return {
    inboundCourse,
    outboundCourse,
    inboundHeading,
    outboundHeading,
    inboundWca,
    entryAngle,
    entryType,
  };
}

export function formatHeading(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return String(Math.round(value)).padStart(3, '0');
}

export function parseHeadingInput(value: string): number | null {
  if (!value.trim()) return null;
  const n = parseNum(value);
  if (n < 0 || n > 360) return null;
  return normalizeHeading(n);
}

/** Teardrop initial outbound heading (30° toward holding side). */
export function teardropHeading(outboundCourse: number, holdSide: HoldSide): number {
  const offset = holdSide === 'Right' ? -30 : 30;
  return normalizeHeading(outboundCourse + offset);
}

export const ENTRY_DESCRIPTIONS: Record<EntryType, string> = {
  Direct:
    'Fly directly to the fix and turn to follow the holding pattern. Used when arriving within 70° of the inbound course on the holding side.',
  Teardrop:
    'Cross the fix, turn outbound to a heading 30° offset toward the holding side, fly for one minute, then turn to intercept the inbound course.',
  Parallel:
    'Cross the fix, turn to parallel the outbound course on the non-holding side for one minute, then turn through more than 180° to intercept inbound.',
};

export const ENTRY_COLORS: Record<EntryType, string> = {
  Direct: '#22c55e',
  Parallel: '#3b82f6',
  Teardrop: '#ec4899',
};

/** Sector boundaries (° clockwise from inbound course) for diagram shading. */
export function entrySectors(holdSide: HoldSide): { type: EntryType; start: number; end: number }[] {
  if (holdSide === 'Right') {
    return [
      { type: 'Direct', start: 0, end: 70 },
      { type: 'Teardrop', start: 70, end: 130 },
      { type: 'Parallel', start: 130, end: 310 },
      { type: 'Direct', start: 310, end: 360 },
    ];
  }
  return [
    { type: 'Parallel', start: 0, end: 170 },
    { type: 'Teardrop', start: 170, end: 230 },
    { type: 'Direct', start: 230, end: 290 },
    { type: 'Parallel', start: 290, end: 360 },
  ];
}
