import type { NavlogLeg, NavlogLegResult, NavlogSettings } from './types';
import { parseNum, toDeg, toRad } from './utils';

/** ISA temperature (°C) at pressure altitude (ft). */
export function isaTempAtAltitude(altitudeFt: number): number {
  return 15 - 1.98 * (altitudeFt / 1000);
}

/** IAS (kt) → TAS (kt) using pressure altitude (ft) and OAT (°C). */
export function iasToTas(ias: number, pressureAltFt: number, oatC: number): number | null {
  if (ias <= 0) return null;
  const oatK = oatC + 273.15;
  const densityRatio = (288.15 / oatK) * Math.pow(1 - 0.0000226 * pressureAltFt, 5.256);
  if (densityRatio <= 0) return null;
  return ias / Math.sqrt(densityRatio);
}

function effectiveTas(leg: NavlogLeg, settings: NavlogSettings): number {
  const entered = parseNum(leg.tas);
  if (!settings.calculateTasFromIas) return entered;

  const alt = parseNum(leg.altitude);
  const oat =
    settings.oat.trim() !== ''
      ? parseNum(settings.oat)
      : isaTempAtAltitude(alt);

  return iasToTas(entered, alt, oat) ?? 0;
}

export function calculateNavlogLeg(leg: NavlogLeg, settings: NavlogSettings): NavlogLegResult | null {
  const course = parseNum(leg.trueCourse);
  const distance = parseNum(leg.distance);
  const tasVal = effectiveTas(leg, settings);
  const wDir = parseNum(leg.windDir);
  const wSpd = parseNum(leg.windSpeed);
  const magVar = parseNum(leg.magVar);
  const magDev = parseNum(leg.magDev);

  if (tasVal <= 0) return null;

  const windAngle = toRad(wDir - course);
  const ratio = (wSpd * Math.sin(windAngle)) / tasVal;
  if (Math.abs(ratio) > 1) return null;

  const wcaRad = Math.asin(ratio);
  const wca = toDeg(wcaRad);
  const trueHeading = (course + wca + 360) % 360;
  const magHeading = (trueHeading + magVar + 360) % 360;
  const compassHeading = (magHeading + magDev + 360) % 360;
  const groundSpeed = tasVal * Math.cos(wcaRad) - wSpd * Math.cos(windAngle);
  if (groundSpeed <= 0) return null;

  const timeHours = distance > 0 ? distance / groundSpeed : 0;
  const fuelBurn = parseNum(settings.fuelBurnGph);
  const fuelUsed = fuelBurn * timeHours;

  return {
    wca,
    trueHeading,
    magHeading,
    compassHeading,
    groundSpeed,
    timeHours,
    fuelUsed,
    tas: tasVal,
  };
}

export function formatNavlogNumber(value: number, decimals: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '';
  return value.toFixed(decimals);
}
