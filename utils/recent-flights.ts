import type { RecentFlight } from '@/components/home/types';

export type FlightListRow = {
  id: string;
  flight_date: string;
  aircraft_type: string | null;
  aircraft_registration: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  pic_name: string | null;
  co_pilot_name: string | null;
  takeoffs: number | null;
  landings: number | null;
  go_arounds: number | null;
  block_time_minutes: number | null;
};

export function formatMinutesToHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function mapFlightRowToRecentFlight(
  flight: FlightListRow,
  defaultPilotName = 'Pilot'
): RecentFlight {
  const date = new Date(flight.flight_date);
  return {
    id: flight.id,
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    year: String(date.getFullYear()),
    aircraft: flight.aircraft_type || '-',
    aircraftTag: flight.aircraft_registration || '-',
    routeFrom: flight.origin_iata || '-',
    routeTo: flight.destination_iata || '-',
    pilotName: flight.pic_name || defaultPilotName,
    coPilotName: flight.co_pilot_name || '-',
    duration: formatMinutesToHours(flight.block_time_minutes || 0),
    landings: flight.landings ?? 0,
    takeoffs: flight.takeoffs ?? 0,
    goArounds: flight.go_arounds ?? 0,
  };
}
