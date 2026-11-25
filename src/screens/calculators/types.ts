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
  checkpoint: string;
  trueCourse: string;
  altitude: string;
  tas: string;
  windDir: string;
  windSpeed: string;
  magVar: string;
  magDev: string;
  distance: string;
}

export interface NavlogSettings {
  calculateTasFromIas: boolean;
  fuelBurnGph: string;
  /** Blank = ISA temp at row altitude when deriving TAS from IAS. */
  oat: string;
}

export interface NavlogLegResult {
  wca: number;
  trueHeading: number;
  magHeading: number;
  compassHeading: number;
  groundSpeed: number;
  timeHours: number;
  fuelUsed: number;
  tas: number;
}

export interface NavlogSavedState {
  legs: NavlogLeg[];
  settings: NavlogSettings;
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
export type HoldCourseMode = 'Inbound' | 'Outbound';

export interface HoldingPatternResult {
  inboundCourse: number;
  outboundCourse: number;
  inboundHeading: number;
  outboundHeading: number;
  inboundWca: number;
  entryAngle: number;
  entryType: EntryType;
}

export type MachMode = 'TAStoMach' | 'MachToTAS';

export type EB6Mode = 'TSD' | 'Fuel' | 'Wind';

export type TsdSolve = 'time' | 'speed' | 'distance';
