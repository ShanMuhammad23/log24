import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { RecentFlightCard } from '@/components/home/RecentFlightCard';
import type { RecentFlight } from '@/components/home/types';
import { useSupabaseSession } from '@/utils/auth';
import { flightDetailsHref } from '@/utils/flight-details-navigation';
import { getProfile } from '@/utils/profile';
import { FlightListRow, mapFlightRowToRecentFlight } from '@/utils/recent-flights';
import { supabase } from '@/utils/supabase';

function RecentFlightCardSkeleton() {
  return <View className="mx-5 mb-3 h-40 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />;
}

export default function MyFlightsScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [flights, setFlights] = useState<RecentFlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlights = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const [{ data }, profile] = await Promise.all([
        supabase
          .from('flights')
          .select(
            'id, flight_date, aircraft_type, aircraft_registration, origin_iata, destination_iata, pic_name, co_pilot_name, takeoffs, landings, go_arounds, block_time_minutes'
          )
          .eq('user_id', userId)
          .order('flight_date', { ascending: false }),
        getProfile(userId),
      ]);

      const defaultPilotName =
        profile?.full_name || (session.user.user_metadata?.full_name as string | undefined) || 'Pilot';

      setFlights(
        ((data || []) as FlightListRow[]).map((row) => mapFlightRowToRecentFlight(row, defaultPilotName))
      );
      setLoading(false);
    };

    loadFlights();
  }, [session?.user?.id, session?.user?.user_metadata?.full_name]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#64748b" />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">All Flights</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}>
          {loading ? (
            [1, 2, 3, 4].map((id) => <RecentFlightCardSkeleton key={id} />)
          ) : flights.length === 0 ? (
            <Text className="px-5 pt-2 text-sm text-slate-500 dark:text-slate-400">
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
