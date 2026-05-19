export type CalculatorStackParamList = {
  CalculatorsHome: undefined;
  EB6Calculator: undefined;
  NavlogCalculator: undefined;
  HoldingPattern: undefined;
  WeightBalance: undefined;
  WindComponents: undefined;
  PressureAltitude: undefined;
  DensityAltitude: undefined;
  MachSpeed: undefined;
  TrueAirSpeed: undefined;
  IndicatedAirSpeed: undefined;
};

export type CalculatorRouteHref =
  | '/calculation'
  | '/calculation/eb6'
  | '/calculation/navlog'
  | '/calculation/holding-pattern'
  | '/calculation/weight-balance'
  | '/calculation/wind-components'
  | '/calculation/pressure-altitude'
  | '/calculation/density-altitude'
  | '/calculation/mach-speed'
  | '/calculation/true-airspeed'
  | '/calculation/indicated-airspeed';

export interface NavlogLeg {
  id: string;
  name: string;
  course: string;
  distance: string;
  tas: string;
  windDir: string;
  windSpeed: string;
  magVar: string;
  fuelFlow: string;
}

export interface NavlogLegResult {
  trueHeading: number;
  magHeading: number;
  groundSpeed: number;
  ete: number;
  fuelUsed: number;
}

export interface WBItem {
  id: string;
  name: string;
  weight: string;
  arm: string;
}

export interface WindCorrectionResult {
  wca: number;
  heading: number;
  groundSpeed: number;
}

export type HoldSide = 'Right' | 'Left';
export type EntryType = 'Direct' | 'Teardrop' | 'Parallel';

export type MachMode = 'TAStoMach' | 'MachToTAS';

export type EB6Mode = 'TSD' | 'Fuel' | 'Wind';

export type TsdSolve = 'time' | 'speed' | 'distance';
