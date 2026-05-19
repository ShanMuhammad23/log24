import { useEffect, useMemo, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { useSupabaseSession } from '@/utils/auth';
import { fetchCareerTotals, FlightTotalsRow } from '@/utils/career';

function toHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function percentFromMinutes(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function RequirementCard({
  title,
  minimumLabel,
  currentMinutes,
  targetMinutes,
  accentColor,
  icon,
}: {
  title: string;
  minimumLabel: string;
  currentMinutes: number;
  targetMinutes: number;
  accentColor: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}) {
  const progress = percentFromMinutes(currentMinutes, targetMinutes);

  return (
    <View className="mb-3 w-[48.5%] rounded-2xl border border-slate-200 bg-white p-3">
      <View className="flex-row items-start gap-2">
        <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
          <FontAwesome name={icon} size={20} color={accentColor} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900">{title}</Text>
          <Text className="text-sm text-slate-500">{minimumLabel}</Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-end justify-between">
        <Text className="text-2xl font-semibold text-slate-900">{toHours(currentMinutes)}</Text>
        <Text className="mb-0.5 text-base font-medium text-slate-500">/ {toHours(targetMinutes)}</Text>
      </View>

      <View className="mt-2 flex-row items-center gap-2">
        <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
        </View>
        <View className="rounded-lg bg-slate-100 px-2 py-1">
          <Text className="text-sm font-semibold" style={{ color: accentColor }}>
            {progress}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CareerScreen() {
  const { session } = useSupabaseSession();
  const [rows, setRows] = useState<FlightTotalsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await fetchCareerTotals(userId);

      setRows((data || []) as FlightTotalsRow[]);
      setLoading(false);
    };

    load();
  }, [session?.user?.id]);

  const totals = useMemo(() => {
    const total = rows.reduce((acc, row) => acc + (row.block_time_minutes || 0), 0);
    const pic = rows.reduce((acc, row) => acc + (row.pic_time_minutes || 0), 0);
    const copilot = rows.reduce((acc, row) => acc + (row.sic_time_minutes || 0), 0);
    const dual = rows.reduce((acc, row) => {
      if (row.operating_capacity === 'dual') return acc + (row.block_time_minutes || 0);
      return acc;
    }, 0);
    const instruction = rows.reduce((acc, row) => {
      if (row.operating_capacity === 'instructor') return acc + (row.block_time_minutes || 0);
      return acc;
    }, 0);
    const crossCountry = rows.reduce((acc, row) => {
      if ((row.cross_country_total_minutes || 0) > 0) return acc + (row.cross_country_total_minutes || 0);
      if (row.is_cross_country) return acc + (row.block_time_minutes || 0);
      return acc;
    }, 0);
    const simulator = rows.reduce((acc, row) => acc + (row.ifr_simulated_minutes || 0), 0);
    const night = rows.reduce((acc, row) => acc + (row.night_time_minutes || 0), 0);
    const ifrDual = simulator;
    const multiEngine = rows.reduce((acc, row) => acc + (row.instrument_time_minutes || 0), 0);
    const nightDual = Math.min(night, dual);
    const nightSolo = Math.max(night - nightDual, 0);
    const cplTarget = 200 * 60;
    const remaining = Math.max(cplTarget - total, 0);
    const progress = percentFromMinutes(total, cplTarget);

    return {
      total,
      pic,
      copilot,
      dual,
      instruction,
      crossCountry,
      night,
      ifrDual,
      multiEngine,
      nightDual,
      nightSolo,
      remaining,
      progress,
    };
  }, [rows]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 120 }}>
          <Text className="mb-3 text-center text-3xl font-bold text-slate-900">Career</Text>

          {loading ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : (
            <>
              <View className="mb-4 rounded-3xl bg-blue-700 p-4 shadow-lg shadow-blue-300/50">
                <View className="flex-row items-start">
                  <View className="h-28 w-28 items-center justify-center rounded-full border-8 border-blue-200">
                    <Text className="text-2xl font-bold text-white">{totals.progress}%</Text>
                    <Text className="text-sm font-medium text-blue-100">Completed</Text>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-xs font-medium uppercase tracking-wide text-blue-100">CPL Overall Progress</Text>
                    <View className="mt-1 flex-row items-end">
                      <Text className="text-5xl font-bold text-white">{toHours(totals.total)}</Text>
                      <Text className="mb-1 ml-2 text-lg font-medium text-blue-100">/ {toHours(200 * 60)} HRS</Text>
                    </View>
                    <View className="mt-3 h-2 overflow-hidden rounded-full bg-blue-400">
                      <View className="h-full rounded-full bg-white" style={{ width: `${totals.progress}%` }} />
                    </View>
                    <View className="mt-2.5 flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs uppercase text-blue-100">Remaining Hours</Text>
                        <Text className="text-xl font-semibold text-white">{toHours(totals.remaining)} hrs</Text>
                      </View>
                      <View>
                        <Text className="text-xs uppercase text-blue-100">Target</Text>
                        <Text className="text-xl font-semibold text-white">CPL License</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-2xl font-semibold text-slate-900">CPL Requirements</Text>
                <Pressable className="flex-row items-center gap-1">
                  <FontAwesome name="info-circle" size={14} color="#2563eb" />
                  <Text className="text-sm font-medium text-blue-600">DGCA Requirements</Text>
                </Pressable>
              </View>

              <View className="mb-1 flex-row flex-wrap justify-between">
                <RequirementCard
                  title="Solo PIC"
                  minimumLabel="Minimum 100 hrs"
                  currentMinutes={totals.pic}
                  targetMinutes={100 * 60}
                  accentColor="#2563eb"
                  icon="user"
                />
                <RequirementCard
                  title="Solo X Country"
                  minimumLabel="Minimum 50 hrs"
                  currentMinutes={totals.crossCountry}
                  targetMinutes={50 * 60}
                  accentColor="#14b8a6"
                  icon="location-arrow"
                />
                <RequirementCard
                  title="Night Solo"
                  minimumLabel="Minimum 5 hrs"
                  currentMinutes={totals.nightSolo}
                  targetMinutes={5 * 60}
                  accentColor="#6d28d9"
                  icon="moon-o"
                />
                <RequirementCard
                  title="Night Dual"
                  minimumLabel="Minimum 5 hrs"
                  currentMinutes={totals.nightDual}
                  targetMinutes={5 * 60}
                  accentColor="#7c3aed"
                  icon="users"
                />
                <RequirementCard
                  title="IF Dual"
                  minimumLabel="Minimum 20 hrs"
                  currentMinutes={totals.ifrDual}
                  targetMinutes={20 * 60}
                  accentColor="#ea580c"
                  icon="dot-circle-o"
                />
                <RequirementCard
                  title="Multi Engine"
                  minimumLabel="Minimum 15 hrs"
                  currentMinutes={totals.multiEngine}
                  targetMinutes={15 * 60}
                  accentColor="#ca8a04"
                  icon="fighter-jet"
                />
              </View>

              <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <FontAwesome name="plane" size={18} color="#2563eb" />
                    </View>
                    <View>
                      <Text className="text-lg font-semibold text-slate-900">CPL Total (All Requirements)</Text>
                      <Text className="text-sm text-slate-500">Minimum 200 hrs</Text>
                    </View>
                  </View>
                  <View className="rounded-lg bg-slate-100 px-3 py-1">
                    <Text className="text-base font-semibold text-blue-700">{totals.progress}%</Text>
                  </View>
                </View>
                <View className="mt-2 flex-row items-end justify-center">
                  <Text className="text-3xl font-bold text-blue-700">{toHours(totals.total)}</Text>
                  <Text className="mb-0.5 ml-2 text-base font-medium text-slate-500">/ {toHours(200 * 60)}</Text>
                </View>
                <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <View className="h-full rounded-full bg-blue-500" style={{ width: `${totals.progress}%` }} />
                </View>
              </View>

              <View className="rounded-2xl border border-slate-200 bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <FontAwesome name="calendar" size={18} color="#2563eb" />
                    </View>
                    <View>
                      <Text className="text-xl font-semibold text-slate-900">Buffer Time Left</Text>
                      <Text className="text-sm text-slate-600">You have approximately 11 Months 14 Days left to complete CPL.</Text>
                    </View>
                  </View>
                  <Pressable className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
                    <Text className="font-medium text-blue-700">View Projection</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <FloatingLogButton />
      </View>
    </SafeAreaView>
  );
}
