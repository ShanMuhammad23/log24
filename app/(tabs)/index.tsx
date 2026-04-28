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

const summaryMetrics: FlightMetric[] = [
  { key: 'pic', label: 'PIC', value: '620:15', unit: 'HRS', icon: 'plane' },
  { key: 'cross-country', label: 'Cross Country', value: '512:30', unit: 'HRS', icon: 'globe' },
  { key: 'night', label: 'Night', value: '210:45', unit: 'HRS', icon: 'moon-o' },
  { key: 'dual', label: 'Dual', value: '450:30', unit: 'HRS', icon: 'users' },
];

const recentFlights: RecentFlight[] = [
  {
    id: '1',
    day: '26',
    month: 'APR',
    year: '2026',
    aircraft: 'PA-28',
    aircraftTag: 'VT-DGI',
    routeFrom: 'BHU',
    routeTo: 'BHU',
    pilotName: 'Arunoday Alok',
    coPilotName: 'Jatin',
    duration: '01:00',
    landings: 4,
    takeoffs: 3,
    goArounds: 1,
  },
  {
    id: '2',
    day: '22',
    month: 'APR',
    year: '2026',
    aircraft: 'PA-28',
    aircraftTag: 'VT-DGE',
    routeFrom: 'BHU',
    routeTo: 'BHU',
    pilotName: 'Arunoday Alok',
    coPilotName: 'Jatin',
    duration: '00:40',
    landings: 2,
    takeoffs: 2,
    goArounds: 0,
  },
  {
    id: '3',
    day: '19',
    month: 'APR',
    year: '2026',
    aircraft: 'PA-28',
    aircraftTag: 'VT-DGC',
    routeFrom: 'BHU',
    routeTo: 'BHU',
    pilotName: 'Arunoday Alok',
    coPilotName: 'Jatin',
    duration: '01:05',
    landings: 5,
    takeoffs: 4,
    goArounds: 1,
  },
  {
    id: '4',
    day: '14',
    month: 'APR',
    year: '2026',
    aircraft: 'PA-28',
    aircraftTag: 'VT-DGE',
    routeFrom: 'BHU',
    routeTo: 'BHU',
    pilotName: 'Arunoday Alok',
    coPilotName: 'Jatin',
    duration: '01:00',
    landings: 3,
    takeoffs: 3,
    goArounds: 0,
  },
];

export default function HomeScreen() {
  const { session } = useSupabaseSession();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const userId = session?.user?.id;
      if (!userId) return;

      const { data } = await getProfile(userId);
      if (data) setProfile(data);
    };

    loadProfile();
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
          <FlightHoursCard totalHours="1405:00" metrics={summaryMetrics} />

          <SectionHeader title="Recent Flights" actionLabel="View All" />
          {recentFlights.map((flight) => (
            <RecentFlightCard key={flight.id} flight={flight} />
          ))}
        </ScrollView>

        <FloatingLogButton />
      </View>
    </SafeAreaView>
  );
}
