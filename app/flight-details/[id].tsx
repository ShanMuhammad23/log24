import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

type FlightDetailRow = {
  id: string;
  flight_date: string;
  flight_number: string | null;
  aircraft_type: string | null;
  aircraft_registration: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  block_time_minutes: number | null;
  pic_time_minutes: number | null;
  sic_time_minutes: number | null;
  night_time_minutes: number | null;
  instrument_time_minutes: number | null;
  remarks: string | null;
  pic_name: string | null;
  co_pilot_name: string | null;
  out_time: string | null;
  in_time: string | null;
  route_points: string | null;
  ifr_actual_minutes: number | null;
  cross_country_total_minutes: number | null;
  instrument_timings_minutes: number | null;
  ifr_simulated_minutes: number | null;
};

function hhmmFromMinutes(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return '00:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTimeOnly(value: string | null) {
  if (!value) return '--:--';
  return value.slice(0, 5);
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }) {
  return (
    <View className="flex-1 items-center border-r border-white/30 px-2 last:border-r-0">
      <FontAwesome name={icon} size={15} color="#dbeafe" />
      <Text className="mt-2 text-center text-[11px] font-semibold uppercase text-blue-100">{label}</Text>
      <Text className="mt-1 text-xl font-bold text-white">{value}</Text>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">{children}</View>;
}

export default function FlightDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSupabaseSession();
  const [flight, setFlight] = useState<FlightDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadFlight = async () => {
      const userId = session?.user?.id;
      if (!userId || !id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('flights')
        .select(
          'id, flight_date, flight_number, aircraft_type, aircraft_registration, origin_iata, destination_iata, block_time_minutes, pic_time_minutes, sic_time_minutes, night_time_minutes, instrument_time_minutes, remarks, pic_name, co_pilot_name, out_time, in_time, route_points, ifr_actual_minutes, cross_country_total_minutes, instrument_timings_minutes, ifr_simulated_minutes'
        )
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle<FlightDetailRow>();

      setFlight(data || null);
      setLoading(false);
    };

    loadFlight();
  }, [id, session?.user?.id]);

  const goArounds = useMemo(() => (flight?.remarks || '').toLowerCase().includes('go-around') ? 1 : 0, [flight?.remarks]);

  const handleDelete = () => {
    if (!flight) return;

    Alert.alert('Delete Flight', 'Are you sure you want to delete this flight?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const { error } = await supabase.from('flights').delete().eq('id', flight.id);
          setDeleting(false);
          if (!error) router.replace('/(tabs)');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!flight) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base text-slate-600">Flight not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-blue-600 px-5 py-3">
          <Text className="font-semibold text-white">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-100">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="rounded-b-3xl bg-blue-700 px-4 pb-4 pt-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-blue-800/40">
              <FontAwesome name="angle-left" size={20} color="#ffffff" />
            </Pressable>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{flight.aircraft_type || '-'}</Text>
              <Text className="text-base font-semibold text-blue-100">{flight.aircraft_registration || '-'}</Text>
              <Text className="mt-1 text-sm text-blue-100">{formatDateLabel(flight.flight_date)}</Text>
            </View>
            <Pressable onPress={() => router.push('/add-flight')} className="h-9 w-9 items-center justify-center rounded-full bg-blue-800/40">
              <FontAwesome name="pencil" size={14} color="#ffffff" />
            </Pressable>
          </View>

          <View className="mt-2 rounded-2xl border border-blue-400/50 bg-blue-600 px-4 py-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-blue-100">Total Flight Time</Text>
            <View className="mt-1 flex-row items-end">
              <Text className="text-6xl font-extrabold text-white">{hhmmFromMinutes(flight.block_time_minutes)}</Text>
              <Text className="mb-2 ml-2 text-base font-bold text-blue-100">HRS</Text>
            </View>
            <View className="mt-4 flex-row">
              <StatTile label="Takeoffs" value="1" icon="send-o" />
              <StatTile label="Landings" value="1" icon="fighter-jet" />
              <StatTile label="Go Around" value={String(goArounds)} icon="wrench" />
              <StatTile label="Night" value={hhmmFromMinutes(flight.night_time_minutes)} icon="moon-o" />
            </View>
          </View>
        </View>

        <View className="px-3 pt-3">
          <SectionCard>
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase text-slate-400">From</Text>
                <Text className="mt-1 text-3xl font-bold text-slate-800">{flight.origin_iata || '-'}</Text>
              </View>
              <FontAwesome name="plane" size={16} color="#2563eb" />
              <View className="flex-1 items-end">
                <Text className="text-xs font-semibold uppercase text-slate-400">To</Text>
                <Text className="mt-1 text-3xl font-bold text-slate-800">{flight.destination_iata || '-'}</Text>
              </View>
            </View>
            <Text className="mt-3 text-sm text-slate-500">{flight.route_points || 'Local / Circuit'}</Text>
          </SectionCard>

          <SectionCard>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase text-slate-400">Pilot (PIC)</Text>
                <Text className="mt-1 text-lg font-semibold text-slate-800">{flight.pic_name || 'N/A'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase text-slate-400">Instructor</Text>
                <Text className="mt-1 text-lg font-semibold text-slate-800">{flight.co_pilot_name || 'N/A'}</Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              <View className="w-[32%]">
                <Text className="text-xs font-semibold uppercase text-slate-400">Aircraft</Text>
                <Text className="mt-1 text-base font-bold text-slate-800">{flight.aircraft_type || '-'}</Text>
              </View>
              <View className="w-[32%]">
                <Text className="text-xs font-semibold uppercase text-slate-400">Registration</Text>
                <Text className="mt-1 text-base font-bold text-slate-800">{flight.aircraft_registration || '-'}</Text>
              </View>
              <View className="w-[32%]">
                <Text className="text-xs font-semibold uppercase text-slate-400">Hobbs</Text>
                <Text className="mt-1 text-base font-bold text-slate-800">
                  {formatTimeOnly(flight.out_time)} - {formatTimeOnly(flight.in_time)}
                </Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard>
            <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Flight Breakdown</Text>
            <View className="flex-row flex-wrap">
              {[
                { label: 'PIC', value: hhmmFromMinutes(flight.pic_time_minutes), icon: 'plane' as const },
                { label: 'Dual', value: hhmmFromMinutes(flight.sic_time_minutes), icon: 'users' as const },
                {
                  label: 'Cross Country',
                  value: hhmmFromMinutes(flight.cross_country_total_minutes),
                  icon: 'globe' as const,
                },
                { label: 'Night', value: hhmmFromMinutes(flight.night_time_minutes), icon: 'moon-o' as const },
                {
                  label: 'Instrument',
                  value: hhmmFromMinutes(flight.instrument_time_minutes),
                  icon: 'clock-o' as const,
                },
              ].map((item) => (
                <View key={item.label} className="w-1/5 items-center border-r border-slate-200 px-1 last:border-r-0">
                  <FontAwesome name={item.icon} size={15} color="#1e3a8a" />
                  <Text className="mt-2 text-center text-[11px] font-semibold uppercase text-slate-500">{item.label}</Text>
                  <Text className="mt-1 text-sm font-bold text-slate-800">{item.value}</Text>
                  <Text className="text-[10px] text-slate-500">HRS</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard>
            <Text className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Remarks / Notes</Text>
            <Text className="text-sm text-slate-700">{flight.remarks || 'No remarks added.'}</Text>
          </SectionCard>

          <SectionCard>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">Attachments</Text>
                <Text className="mt-1 text-sm text-slate-700">No attachments added</Text>
              </View>
              <Pressable className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2">
                <Text className="font-semibold text-blue-700">Upload</Text>
              </Pressable>
            </View>
          </SectionCard>

          <View className="mt-2 flex-row gap-3">
            <Pressable onPress={() => router.push('/add-flight')} className="flex-1 items-center rounded-xl bg-blue-700 py-3">
              <Text className="font-semibold text-white">Edit Flight</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              className="flex-1 items-center rounded-xl border border-red-200 bg-white py-3">
              <Text className="font-semibold text-red-600">{deleting ? 'Deleting...' : 'Delete Flight'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
