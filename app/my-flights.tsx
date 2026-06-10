import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { RecentFlightCard } from '@/components/home/RecentFlightCard';
import type { RecentFlight } from '@/components/home/types';
import { useSupabaseSession } from '@/utils/auth';
import { flightDetailsHref } from '@/utils/flight-details-navigation';
import { deleteFlights, fetchUserFlights, flightErrorMessage, mapFlightsToRecent } from '@/utils/flights';
import { getProfile } from '@/utils/profile';
import type { FlightListRow } from '@/utils/recent-flights';

function RecentFlightCardSkeleton() {
  return <View className="mx-5 mb-3 h-40 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />;
}

export default function MyFlightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSupabaseSession();
  const [flights, setFlights] = useState<RecentFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const loadFlights = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setFlights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [{ data, error }, profile] = await Promise.all([fetchUserFlights(userId), getProfile(userId)]);

    if (error) {
      setFlights([]);
      setLoading(false);
      return;
    }

    const defaultPilotName =
      profile?.full_name || (session.user.user_metadata?.full_name as string | undefined) || 'Pilot';

    setFlights(mapFlightsToRecent((data || []) as FlightListRow[], defaultPilotName));
    setLoading(false);
  }, [session?.user?.id, session?.user?.user_metadata?.full_name]);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const allSelected = flights.length > 0 && selectedIds.size === flights.length;
  const selectedCount = selectedIds.size;

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleFlightSelection = (flightId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(flightId)) {
        next.delete(flightId);
      } else {
        next.add(flightId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(flights.map((flight) => flight.id)));
  };

  const confirmBulkDelete = async () => {
    const userId = session?.user?.id;
    if (!userId || selectedCount === 0) return;

    const idsToDelete = Array.from(selectedIds);
    setDeleting(true);
    const { error } = await deleteFlights(userId, idsToDelete);
    setDeleting(false);
    setConfirmDeleteVisible(false);

    if (error) {
      Alert.alert('Delete failed', flightErrorMessage(error));
      return;
    }

    const deletedIds = new Set(idsToDelete);
    setFlights((prev) => prev.filter((flight) => !deletedIds.has(flight.id)));
    exitSelectionMode();
  };

  const openFlightDetails = useCallback(
    (flight: RecentFlight) => {
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
      );
    },
    [router]
  );

  const headerTitle = useMemo(() => {
    if (!selectionMode) return 'All Flights';
    if (selectedCount === 0) return 'Select Flights';
    return `${selectedCount} Selected`;
  }, [selectionMode, selectedCount]);

  const deleteCountLabel = selectedCount === 1 ? '1 flight' : `${selectedCount} flights`;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-3 px-4 pb-2 pt-2">
          <View className="flex-1 flex-row items-center gap-3">
            <Pressable
              onPress={selectionMode ? exitSelectionMode : () => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
              <FontAwesome name={selectionMode ? 'times' : 'angle-left'} size={18} color="#64748b" />
            </Pressable>
            <Text className="flex-1 text-2xl font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {headerTitle}
            </Text>
          </View>

          {!loading && flights.length > 0 ? (
            selectionMode ? (
              <Pressable onPress={toggleSelectAll} className="rounded-full bg-slate-200 px-3 py-2 dark:bg-slate-800">
                <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setSelectionMode(true)}
                className="rounded-full bg-slate-200 px-3 py-2 dark:bg-slate-800">
                <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">Select</Text>
              </Pressable>
            )
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: selectionMode && selectedCount > 0 ? 200 : 120 }}>
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
                selectionMode={selectionMode}
                selected={selectedIds.has(flight.id)}
                onSelectionToggle={() => toggleFlightSelection(flight.id)}
                onPress={() => openFlightDetails(flight)}
              />
            ))
          )}
        </ScrollView>

        {selectionMode && selectedCount > 0 ? (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              elevation: 20,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
            className="border-t border-slate-200 bg-white px-5 pt-4 dark:border-slate-800 dark:bg-slate-900">
            <Pressable
              onPress={() => setConfirmDeleteVisible(true)}
              disabled={deleting}
              className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                deleting ? 'bg-red-400' : 'bg-red-600'
              }`}>
              {deleting ? <ActivityIndicator color="#ffffff" size="small" /> : null}
              <FontAwesome name="trash-o" size={16} color="#ffffff" />
              <Text className="text-base font-semibold text-white">
                {deleting ? 'Deleting...' : `Delete ${selectedCount} Flight${selectedCount === 1 ? '' : 's'}`}
              </Text>
            </Pressable>
          </View>
        ) : (
          <FloatingLogButton />
        )}
      </View>

      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setConfirmDeleteVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-slate-900">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Delete Flights</Text>
            <Text className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete {deleteCountLabel}? This cannot be undone.
            </Text>
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setConfirmDeleteVisible(false)}
                disabled={deleting}
                className="flex-1 items-center rounded-xl border border-slate-200 py-3 dark:border-slate-700">
                <Text className="font-semibold text-slate-700 dark:text-slate-200">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmBulkDelete}
                disabled={deleting}
                className={`flex-1 items-center rounded-xl py-3 ${deleting ? 'bg-red-400' : 'bg-red-600'}`}>
                {deleting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="font-semibold text-white">Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
