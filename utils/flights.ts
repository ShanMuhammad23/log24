import type { RecentFlight } from '@/components/home/types';
import { FlightListRow, mapFlightRowToRecentFlight } from '@/utils/recent-flights';
import { supabase } from '@/utils/supabase';

const FLIGHT_LIST_SELECT =
  'id, flight_date, aircraft_type, aircraft_registration, origin_iata, destination_iata, pic_name, co_pilot_name, takeoffs, landings, go_arounds, block_time_minutes';

export async function fetchUserFlights(userId: string) {
  return supabase
    .from('flights')
    .select(FLIGHT_LIST_SELECT)
    .eq('user_id', userId)
    .order('flight_date', { ascending: false });
}

export function mapFlightsToRecent(
  rows: FlightListRow[],
  defaultPilotName = 'Pilot'
): RecentFlight[] {
  return rows.map((row) => mapFlightRowToRecentFlight(row, defaultPilotName));
}

export async function deleteFlights(userId: string, flightIds: string[]) {
  if (flightIds.length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from('flights')
    .delete()
    .eq('user_id', userId)
    .in('id', flightIds);

  return { error };
}

export function flightErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: string }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'Something went wrong. Please try again.';
}
