import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlightHoursCard } from '@/components/home/FlightHoursCard';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { HomeHeader } from '@/components/home/HomeHeader';
import { RecentFlightCard } from '@/components/home/RecentFlightCard';
import { RecencyAlertBanner } from '@/components/home/RecencyAlertBanner';
import { RecencyAlertModal } from '@/components/home/RecencyAlertModal';
import { SectionHeader } from '@/components/home/SectionHeader';
import { FlightMetric, RecentFlight } from '@/components/home/types';
import { useSupabaseSession } from '@/utils/auth';
import { flightDetailsHref } from '@/utils/flight-details-navigation';
import { getProfile, ProfileRecord, RANK_OPTIONS, toLabel } from '@/utils/profile';
import { aggregateFlightTotals, fetchCareerTotals, FlightTotalsRow } from '@/utils/career';
import { getRecencyStatus, isCplStudentPilot } from '@/utils/recency';
import { supabase } from '@/utils/supabase';

type FlightRow = {
  id: string;
  flight_date: string;
  flight_number: string | null;
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
  pic_time_minutes: number | null;
  sic_time_minutes: number | null;
  night_time_minutes: number | null;
};

function RecentFlightCardSkeleton() {
  return <View className="mx-5 mb-3 h-40 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />;
}

function formatMinutesToHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
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
  const [loadingHomeData, setLoadingHomeData] = useState(true);
  const [lastFlightDate, setLastFlightDate] = useState<string | null>(null);
  const [recencyModalDismissed, setRecencyModalDismissed] = useState(false);

  useEffect(() => {
    setRecencyModalDismissed(false);
  }, [lastFlightDate]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const userId = session?.user?.id;
        if (!userId) {
          setLoadingHomeData(false);
          return;
        }

        const [{ data: profileData }, { data: flightsData, error: flightsError }, { data: totalsData }] =
          await Promise.all([
            getProfile(userId),
            supabase
              .from('flights')
              .select(
                'id, flight_date, flight_number, aircraft_type, aircraft_registration, origin_iata, destination_iata, pic_name, co_pilot_name, takeoffs, landings, go_arounds, block_time_minutes, pic_time_minutes, sic_time_minutes, night_time_minutes'
              )
              .eq('user_id', userId)
              .order('flight_date', { ascending: false })
              .limit(20),
            fetchCareerTotals(userId),
          ]);

        if (profileData) setProfile(profileData);

        const totals = aggregateFlightTotals((totalsData || []) as FlightTotalsRow[]);
        setTotalHours(formatMinutesToHours(totals.total));
        setSummaryMetrics([
          { key: 'pic', label: 'PIC', value: formatMinutesToHours(totals.pic), unit: 'HRS', icon: 'plane' },
          {
            key: 'cross-country',
            label: 'Cross Country',
            value: formatMinutesToHours(totals.crossCountry),
            unit: 'HRS',
            icon: 'globe',
          },
          { key: 'night', label: 'Night', value: formatMinutesToHours(totals.night), unit: 'HRS', icon: 'moon-o' },
          { key: 'dual', label: 'Dual', value: formatMinutesToHours(totals.dual), unit: 'HRS', icon: 'users' },
        ]);

        if (flightsError || !flightsData) {
          return;
        }

        const rows = flightsData as FlightRow[];
        setLastFlightDate(rows[0]?.flight_date ?? null);

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
              pilotName: flight.pic_name || profileData?.full_name || 'Pilot',
              coPilotName: flight.co_pilot_name || '-',
              duration: formatMinutesToHours(flight.block_time_minutes || 0),
              landings: flight.landings ?? 0,
              takeoffs: flight.takeoffs ?? 0,
              goArounds: flight.go_arounds ?? 0,
            };
          })
        );
      } finally {
        setLoadingHomeData(false);
      }
    };

    loadHomeData();
  }, [session?.user?.id]);

  const pilotName =
    profile?.full_name ||
    (session?.user?.user_metadata?.full_name as string | undefined) ||
    'Pilot';
  const subtitle = toLabel(profile?.rank, RANK_OPTIONS);

  const recencyStatus = useMemo(() => {
    if (!isCplStudentPilot(profile)) return null;
    return getRecencyStatus(lastFlightDate);
  }, [profile, lastFlightDate]);

  const showRecencyBanner = Boolean(recencyStatus?.showAlert);
  const showRecencyModal = Boolean(recencyStatus?.showModal && !recencyModalDismissed);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          className="flex-1">
          <HomeHeader pilotName={pilotName} subtitle={subtitle} onMenuPress={() => router.push('/more')} />
          {!loadingHomeData && showRecencyBanner && recencyStatus ? (
            <RecencyAlertBanner daysRemaining={recencyStatus.daysRemaining} />
          ) : null}
          {loadingHomeData ? (
            <View className="mx-5 h-52 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          ) : (
            <FlightHoursCard totalHours={totalHours} metrics={summaryMetrics} />
          )}

          <SectionHeader
            title="Recent Flights"
            actionLabel="View All"
            onActionPress={() => router.push('/career')}
          />
          {loadingHomeData
            ? [1, 2, 3].map((id) => <RecentFlightCardSkeleton key={id} />)
            : recentFlights.map((flight) => (
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
              ))}
          {!loadingHomeData && recentFlights.length === 0 ? (
            <Text className="px-5 pt-2 text-sm text-slate-500 dark:text-slate-400">No flights logged yet.</Text>
          ) : null}
        </ScrollView>

        <FloatingLogButton />
      </View>

      {recencyStatus ? (
        <RecencyAlertModal
          visible={showRecencyModal}
          daysRemaining={recencyStatus.daysRemaining}
          onDismiss={() => setRecencyModalDismissed(true)}
        />
      ) : null}
    </SafeAreaView>
  );
}
