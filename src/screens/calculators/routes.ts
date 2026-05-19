import type { CalculatorRouteHref, CalculatorStackParamList } from './types';

export const CALCULATOR_ROUTE_HREFS: Record<keyof CalculatorStackParamList, CalculatorRouteHref> = {
  CalculatorsHome: '/calculation',
  EB6Calculator: '/calculation/eb6',
  NavlogCalculator: '/calculation/navlog',
  HoldingPattern: '/calculation/holding-pattern',
  WeightBalance: '/calculation/weight-balance',
  WindComponents: '/calculation/wind-components',
  PressureAltitude: '/calculation/pressure-altitude',
  DensityAltitude: '/calculation/density-altitude',
  MachSpeed: '/calculation/mach-speed',
  TrueAirSpeed: '/calculation/true-airspeed',
  IndicatedAirSpeed: '/calculation/indicated-airspeed',
};
