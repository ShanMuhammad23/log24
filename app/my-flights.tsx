import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { useSupabaseSession } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

type FlightChipRow = {
  id: string;
  flight_date: string;
  aircraft_registration: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  block_time_minutes: number | null;
};

function toHHMM(minutes: number | null) {
  if (!minutes) return '00:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MyFlightsScreen() {
  const { session } = useSupabaseSession();
  const [flights, setFlights] = useState<FlightChipRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlights = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('flights')
        .select('id, flight_date, aircraft_registration, origin_iata, destination_iata, block_time_minutes')
        .eq('user_id', userId)
        .order('flight_date', { ascending: false });

      setFlights((data || []) as FlightChipRow[]);
      setLoading(false);
    };

    loadFlights();
  }, [session?.user?.id]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120 }}>
          <Text className="mb-5 px-1 text-2xl font-bold text-white">My Flights</Text>

          {loading ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color="#93c5fd" />
            </View>
          ) : flights.length === 0 ? (
            <Text className="px-1 text-sm text-slate-400">No flights found. Tap + to add your first flight.</Text>
          ) : (
            flights.map((flight) => (
              <View key={flight.id} className="mb-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                <View className="flex-row flex-wrap gap-2">
                  <View className="rounded-full bg-slate-800 px-3 py-1">
                    <Text className="text-xs font-semibold text-slate-200">Date: {toDateLabel(flight.flight_date)}</Text>
                  </View>
                  <View className="rounded-full bg-slate-800 px-3 py-1">
                    <Text className="text-xs font-semibold text-slate-200">
                      Reg: {flight.aircraft_registration || '-'}
                    </Text>
                  </View>
                  <View className="rounded-full bg-slate-800 px-3 py-1">
                    <Text className="text-xs font-semibold text-slate-200">
                      {flight.origin_iata || '-'} - {flight.destination_iata || '-'}
                    </Text>
                  </View>
                  <View className="rounded-full bg-blue-900/40 px-3 py-1">
                    <Text className="text-xs font-semibold text-blue-300">Total: {toHHMM(flight.block_time_minutes)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <FloatingLogButton />
      </View>
    </SafeAreaView>
  );
}
