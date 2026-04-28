export type FlightMetric = {
  key: string;
  label: string;
  value: string;
  unit: string;
  icon: string;
};

export type RecentFlight = {
  id: string;
  day: string;
  month: string;
  year: string;
  aircraft: string;
  aircraftTag: string;
  routeFrom: string;
  routeTo: string;
  pilotName: string;
  coPilotName: string;
  duration: string;
  landings: number;
  takeoffs: number;
  goArounds: number;
};
