import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { RecentFlightCard } from '@/components/home/RecentFlightCard';
import { RecentFlight } from '@/components/home/types';
import { useSupabaseSession } from '@/utils/auth';
import { flightDetailsHref } from '@/utils/flight-details-navigation';
import { getProfile } from '@/utils/profile';
import { supabase } from '@/utils/supabase';

type FlightRow = {
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

function formatMinutesToHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function mapFlightToRecent(flight: FlightRow, pilotName: string): RecentFlight {
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
    pilotName: flight.pic_name || pilotName,
    coPilotName: flight.co_pilot_name || '-',
    duration: formatMinutesToHours(flight.block_time_minutes || 0),
    landings: flight.landings ?? 0,
    takeoffs: flight.takeoffs ?? 0,
    goArounds: flight.go_arounds ?? 0,
  };
}

function FlightCardSkeleton() {
  return <View className="mx-3 mb-3 h-40 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />;
}

export default function CareerScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [flights, setFlights] = useState<RecentFlight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlights = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [{ data: profileData }, { data: flightsData }] = await Promise.all([
      getProfile(userId),
      supabase
        .from('flights')
        .select(
          'id, flight_date, aircraft_type, aircraft_registration, origin_iata, destination_iata, pic_name, co_pilot_name, takeoffs, landings, go_arounds, block_time_minutes'
        )
        .eq('user_id', userId)
        .order('flight_date', { ascending: false }),
    ]);

    const pilotName =
      profileData?.full_name || (session?.user?.user_metadata?.full_name as string | undefined) || 'Pilot';

    setFlights(((flightsData || []) as FlightRow[]).map((flight) => mapFlightToRecent(flight, pilotName)));
    setLoading(false);
  }, [session?.user?.id, session?.user?.user_metadata?.full_name]);

  useFocusEffect(
    useCallback(() => {
      loadFlights();
    }, [loadFlights])
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}>
          <View className="mb-3 flex-row items-center justify-between px-3">
            <Text className="text-3xl font-bold text-slate-900 dark:text-slate-100">All Flights</Text>
            {!loading ? (
              <View className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-950/60">
                <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">{flights.length}</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <>
              <FlightCardSkeleton />
              <FlightCardSkeleton />
              <FlightCardSkeleton />
            </>
          ) : flights.length === 0 ? (
            <Text className="px-3 text-sm text-slate-500 dark:text-slate-400">
              No flights logged yet. Tap + to add your first flight.
            </Text>
          ) : (
            flights.map((flight) => (
              <RecentFlightCard
                key={flight.id}
                flight={flight}
                onPress={() =>
                  router.push(
                    flightDetailsHref({
                      id: flight.id,
                      aircraft_type: flight.aircraft !== '-' ? flight.aircraft : undefined,
                      aircraft_registration: flight.aircraftTag !== '-' ? flight.aircraftTag : undefined,
                      origin_iata: flight.routeFrom !== '-' ? flight.routeFrom : undefined,
                      destination_iata: flight.routeTo !== '-' ? flight.routeTo : undefined,
                      block_time: flight.duration,
                      flight_date: `${flight.day} ${flight.month} ${flight.year}`,
                      pic_name: flight.pilotName !== 'Pilot' ? flight.pilotName : undefined,
                      co_pilot_name: flight.coPilotName !== '-' ? flight.coPilotName : undefined,
                    })
                  )
                }
              />
            ))
          )}
        </ScrollView>

        <FloatingLogButton />
      </View>
    </SafeAreaView>
  );
}
