import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlightDetailsBodySkeleton } from '@/components/flight-details/FlightDetailsBodySkeleton';
import { useSupabaseSession } from '@/utils/auth';
import { parseFlightDetailsPreview } from '@/utils/flight-details-navigation';
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
  takeoffs: number | null;
  landings: number | null;
  go_arounds: number | null;
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
  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      {children}
    </View>
  );
}

function HeaderPlaceholder({ className }: { className?: string }) {
  return <View className={`rounded-md bg-blue-500/35 ${className ?? ''}`} />;
}

function FlightDetailsBody({
  flight,
  onDelete,
  deleting,
  onEdit,
}: {
  flight: FlightDetailRow;
  deleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const breakdownIconColor = isDark ? '#93c5fd' : '#1e3a8a';

  return (
    <Animated.View entering={FadeIn.duration(220)} className="px-3 pt-3">
      <SectionCard>
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">From</Text>
            <Text className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{flight.origin_iata || '-'}</Text>
          </View>
            <FontAwesome name="plane" size={16} color="#2563eb" />
          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">To</Text>
            <Text className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{flight.destination_iata || '-'}</Text>
          </View>
        </View>
        <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">{flight.route_points || 'Local / Circuit'}</Text>
      </SectionCard>

      <SectionCard>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Pilot (PIC)</Text>
            <Text className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{flight.pic_name || 'N/A'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Instructor</Text>
            <Text className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{flight.co_pilot_name || 'N/A'}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          <View className="w-[32%]">
            <Text className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Aircraft</Text>
            <Text className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">{flight.aircraft_type || '-'}</Text>
          </View>
          <View className="w-[32%]">
            <Text className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Registration</Text>
            <Text className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">{flight.aircraft_registration || '-'}</Text>
          </View>
          <View className="w-[32%]">
            <Text className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Hobbs</Text>
            <Text className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
              {formatTimeOnly(flight.out_time)} - {formatTimeOnly(flight.in_time)}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard>
        <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Flight Breakdown</Text>
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
            <View key={item.label} className="w-1/5 items-center border-r border-slate-200 px-1 last:border-r-0 dark:border-slate-700">
              <FontAwesome name={item.icon} size={15} color={breakdownIconColor} />
              <Text className="mt-2 text-center text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">{item.label}</Text>
              <Text className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{item.value}</Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400">HRS</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Remarks / Notes</Text>
        <Text className="text-sm text-slate-700 dark:text-slate-300">{flight.remarks || 'No remarks added.'}</Text>
      </SectionCard>

      <SectionCard>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Attachments</Text>
            <Text className="mt-1 text-sm text-slate-700 dark:text-slate-300">No attachments added</Text>
          </View>
          <Pressable className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-950/50">
            <Text className="font-semibold text-blue-700 dark:text-blue-300">Upload</Text>
          </Pressable>
        </View>
      </SectionCard>

      <View className="mt-2 flex-row gap-3">
        <Pressable onPress={onEdit} className="flex-1 items-center rounded-xl bg-blue-700 py-3">
          <Text className="font-semibold text-white">Edit Flight</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          className="flex-1 items-center rounded-xl border border-red-200 bg-white py-3 dark:border-red-900/50 dark:bg-slate-900">
          <Text className="font-semibold text-red-600 dark:text-red-400">{deleting ? 'Deleting...' : 'Delete Flight'}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function FlightDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const preview = useMemo(() => parseFlightDetailsPreview(params), [params]);
  const { id } = params;
  const { session } = useSupabaseSession();
  const [flight, setFlight] = useState<FlightDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const hasPreview = Boolean(
    preview.aircraft_type ||
      preview.aircraft_registration ||
      preview.block_time ||
      preview.flight_date
  );

  useEffect(() => {
    let cancelled = false;

    const loadFlight = async () => {
      const userId = session?.user?.id;
      if (!userId || !id) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('flights')
        .select(
          'id, flight_date, flight_number, aircraft_type, aircraft_registration, origin_iata, destination_iata, block_time_minutes, pic_time_minutes, sic_time_minutes, night_time_minutes, instrument_time_minutes, remarks, pic_name, co_pilot_name, out_time, in_time, route_points, ifr_actual_minutes, cross_country_total_minutes, instrument_timings_minutes, ifr_simulated_minutes, takeoffs, landings, go_arounds'
        )
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle<FlightDetailRow>();

      if (!cancelled) {
        setFlight(data || null);
        setLoading(false);
      }
    };

    setLoading(true);
    loadFlight();

    return () => {
      cancelled = true;
    };
  }, [id, session?.user?.id]);

  const takeoffCount = flight?.takeoffs ?? 0;
  const landingCount = flight?.landings ?? 0;
  const goAroundCount = flight?.go_arounds ?? 0;

  const headerAircraft = flight?.aircraft_type ?? preview.aircraft_type ?? '';
  const headerRegistration = flight?.aircraft_registration ?? preview.aircraft_registration ?? '';
  const headerDate = flight ? formatDateLabel(flight.flight_date) : preview.flight_date ?? '';
  const headerBlockTime = flight
    ? hhmmFromMinutes(flight.block_time_minutes)
    : preview.block_time || (loading ? '00:00' : '00:00');
  const headerNight = flight ? hhmmFromMinutes(flight.night_time_minutes) : loading && !hasPreview ? '—' : '00:00';

  const goToEdit = () => {
    if (!flight) return;
    router.push({ pathname: '/add-flight', params: { id: flight.id } });
  };

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

  if (!loading && !flight) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-100 dark:bg-slate-950">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-slate-600 dark:text-slate-400">Flight not found.</Text>
          <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-blue-600 px-5 py-3">
            <Text className="font-semibold text-white">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const showBodySkeleton = loading && !flight;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="rounded-b-3xl bg-blue-700 px-4 pb-4 pt-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-blue-800/40">
              <FontAwesome name="angle-left" size={20} color="#ffffff" />
            </Pressable>
            <View className="min-h-[72px] flex-1 items-center justify-center px-2">
              {loading && !hasPreview && !flight ? (
                <>
                  <HeaderPlaceholder className="mb-2 h-7 w-36" />
                  <HeaderPlaceholder className="mb-2 h-5 w-24" />
                  <HeaderPlaceholder className="h-4 w-28" />
                </>
              ) : (
                <>
                  <Text className="text-center text-2xl font-bold text-white">{headerAircraft || '-'}</Text>
                  <Text className="text-center text-base font-semibold text-blue-100">{headerRegistration || '-'}</Text>
                  <Text className="mt-1 text-center text-sm text-blue-100">{headerDate || '-'}</Text>
                </>
              )}
            </View>
            <Pressable
              onPress={goToEdit}
              disabled={!flight}
              className="h-9 w-9 items-center justify-center rounded-full bg-blue-800/40">
              <FontAwesome name="pencil" size={14} color="#ffffff" />
            </Pressable>
          </View>

          <View className="mt-2 rounded-2xl border border-blue-400/50 bg-blue-600 px-4 py-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-blue-100">Total Flight Time</Text>
            <View className="mt-1 min-h-[72px] flex-row items-end">
              {loading && !flight && !preview.block_time ? (
                <HeaderPlaceholder className="h-14 w-40" />
              ) : (
                <>
                  <Text className="text-6xl font-extrabold text-white">{headerBlockTime}</Text>
                  <Text className="mb-2 ml-2 text-base font-bold text-blue-100">HRS</Text>
                </>
              )}
            </View>
            <View className="mt-4 flex-row">
              <StatTile label="Takeoffs" value={String(takeoffCount)} icon="send-o" />
              <StatTile label="Landings" value={String(landingCount)} icon="fighter-jet" />
              <StatTile label="Go Around" value={String(goAroundCount)} icon="wrench" />
              <StatTile label="Night" value={headerNight} icon="moon-o" />
            </View>
          </View>
        </View>

        {showBodySkeleton ? (
          <FlightDetailsBodySkeleton />
        ) : flight ? (
          <FlightDetailsBody
            flight={flight}
            deleting={deleting}
            onDelete={handleDelete}
            onEdit={goToEdit}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
