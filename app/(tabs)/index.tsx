import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlightHoursCard } from '@/components/home/FlightHoursCard';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { HomeHeader } from '@/components/home/HomeHeader';
import { RecentFlightCard } from '@/components/home/RecentFlightCard';
import { SectionHeader } from '@/components/home/SectionHeader';
import { FlightMetric, RecentFlight } from '@/components/home/types';
import { useSupabaseSession } from '@/utils/auth';
import { getProfile, ProfileRecord, RANK_OPTIONS, toLabel } from '@/utils/profile';
import { supabase } from '@/utils/supabase';

type FlightRow = {
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
};

function formatMinutesToHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { session } = useSupabaseSession();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<FlightMetric[]>([
    { key: 'pic', label: 'PIC', value: '0:00', unit: 'HRS', icon: 'plane' },
    { key: 'cross-country', label: 'Cross Country', value: '0:00', unit: 'HRS', icon: 'globe' },
    { key: 'night', label: 'Night', value: '0:00', unit: 'HRS', icon: 'moon-o' },
    { key: 'dual', label: 'Dual', value: '0:00', unit: 'HRS', icon: 'users' },
  ]);
  const [recentFlights, setRecentFlights] = useState<RecentFlight[]>([]);
  const [totalHours, setTotalHours] = useState('0:00');

  useEffect(() => {
    const loadHomeData = async () => {
      const userId = session?.user?.id;
      if (!userId) return;

      const [{ data: profileData }, { data: flightsData, error: flightsError }] = await Promise.all([
        getProfile(userId),
        supabase
          .from('flights')
          .select(
            'id, flight_date, flight_number, aircraft_type, aircraft_registration, origin_iata, destination_iata, block_time_minutes, pic_time_minutes, sic_time_minutes, night_time_minutes'
          )
          .eq('user_id', userId)
          .order('flight_date', { ascending: false })
          .limit(20),
      ]);

      if (profileData) setProfile(profileData);
      if (flightsError || !flightsData) return;

      const rows = flightsData as FlightRow[];
      const totalBlockMinutes = rows.reduce((acc, row) => acc + (row.block_time_minutes || 0), 0);
      const totalPicMinutes = rows.reduce((acc, row) => acc + (row.pic_time_minutes || 0), 0);
      const totalNightMinutes = rows.reduce((acc, row) => acc + (row.night_time_minutes || 0), 0);
      const totalDualMinutes = rows.reduce((acc, row) => acc + (row.sic_time_minutes || 0), 0);
      const totalCrossCountryMinutes = rows.reduce((acc, row) => {
        if (row.origin_iata && row.destination_iata && row.origin_iata !== row.destination_iata) {
          return acc + (row.block_time_minutes || 0);
        }
        return acc;
      }, 0);

      setTotalHours(formatMinutesToHours(totalBlockMinutes));
      setSummaryMetrics([
        { key: 'pic', label: 'PIC', value: formatMinutesToHours(totalPicMinutes), unit: 'HRS', icon: 'plane' },
        {
          key: 'cross-country',
          label: 'Cross Country',
          value: formatMinutesToHours(totalCrossCountryMinutes),
          unit: 'HRS',
          icon: 'globe',
        },
        { key: 'night', label: 'Night', value: formatMinutesToHours(totalNightMinutes), unit: 'HRS', icon: 'moon-o' },
        { key: 'dual', label: 'Dual', value: formatMinutesToHours(totalDualMinutes), unit: 'HRS', icon: 'users' },
      ]);

      setRecentFlights(
        rows.slice(0, 8).map((flight) => {
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
            pilotName: profileData?.full_name || 'Pilot',
            coPilotName: '-',
            duration: formatMinutesToHours(flight.block_time_minutes || 0),
            landings: 0,
            takeoffs: 0,
            goArounds: 0,
          };
        })
      );
    };

    loadHomeData();
  }, [session?.user?.id]);

  const pilotName =
    profile?.full_name ||
    (session?.user?.user_metadata?.full_name as string | undefined) ||
    'Pilot';
  const subtitle = toLabel(profile?.rank, RANK_OPTIONS);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          className="flex-1">
          <HomeHeader pilotName={pilotName} subtitle={subtitle} />
          <FlightHoursCard totalHours={totalHours} metrics={summaryMetrics} />

          <SectionHeader title="Recent Flights" actionLabel="View All" />
          {recentFlights.map((flight) => (
            <RecentFlightCard key={flight.id} flight={flight} />
          ))}
          {recentFlights.length === 0 ? (
            <Text className="px-5 pt-2 text-sm text-slate-500 dark:text-slate-400">No flights logged yet.</Text>
          ) : null}
        </ScrollView>

        <FloatingLogButton />
      </View>
    </SafeAreaView>
  );
}
