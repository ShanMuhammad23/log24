import { useEffect, useMemo, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingLogButton } from '@/components/home/FloatingLogButton';
import { useSupabaseSession } from '@/utils/auth';
import {
  aggregateCareerHourSummary,
  aggregateFlightTotals,
  CAREER_TARGETS,
  fetchCareerTotals,
  FlightTotalsRow,
  formatCareerHours,
} from '@/utils/career';

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
  targetMinutes?: number;
  accentColor: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}) {
  const hasTarget = targetMinutes != null && targetMinutes > 0;
  const progress = hasTarget ? percentFromMinutes(currentMinutes, targetMinutes) : 0;

  return (
    <View className="mb-3 w-[48.5%] rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <View className="flex-row items-start gap-2">
        <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
          <FontAwesome name={icon} size={20} color={accentColor} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">{minimumLabel}</Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-end justify-between">
        <Text className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCareerHours(currentMinutes)}</Text>
        {hasTarget ? (
          <Text className="mb-0.5 text-base font-medium text-slate-500 dark:text-slate-400">
            / {formatCareerHours(targetMinutes)}
          </Text>
        ) : null}
      </View>

      {hasTarget ? (
        <View className="mt-2 flex-row items-center gap-2">
          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
          </View>
          <View className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <Text className="text-sm font-semibold" style={{ color: accentColor }}>
              {progress}%
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({ label, minutes }: { label: string; minutes: number }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-slate-600 dark:text-slate-300">{label}</Text>
      <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCareerHours(minutes)}</Text>
    </View>
  );
}

function DetailRequirementCard({
  title,
  subtitle,
  icon,
  accentColor,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <View className="mb-2 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
          <FontAwesome name={icon} size={18} color={accentColor} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text>
        </View>
      </View>
      {children}
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

  const totals = useMemo(() => aggregateFlightTotals(rows), [rows]);
  const summary = useMemo(() => aggregateCareerHourSummary(rows), [rows]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 120 }}>
          <Text className="mb-3 text-center text-3xl font-bold text-slate-900 dark:text-slate-100">Report</Text>

          {loading ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : (
            <>
              <View className="mb-4 rounded-3xl bg-blue-700 p-4 shadow-lg shadow-blue-300/50 dark:shadow-none">
                <View className="flex-row items-start">
                  <View className="h-28 w-28 items-center justify-center rounded-full border-8 border-blue-200">
                    <Text className="text-2xl font-bold text-white">{totals.progress}%</Text>
                    <Text className="text-sm font-medium text-blue-100">Completed</Text>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-xs font-medium uppercase tracking-wide text-blue-100">CPL Overall Progress</Text>
                    <View className="mt-1 flex-row items-end">
                      <Text className="text-5xl font-bold text-white">{formatCareerHours(totals.total)}</Text>
                      <Text className="mb-1 ml-2 text-lg font-medium text-blue-100">
                        / {formatCareerHours(CAREER_TARGETS.total)} HRS
                      </Text>
                    </View>
                    <View className="mt-3 h-2 overflow-hidden rounded-full bg-blue-400">
                      <View className="h-full rounded-full bg-white" style={{ width: `${totals.progress}%` }} />
                    </View>
                    <View className="mt-2.5 flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs uppercase text-blue-100">Remaining Hours</Text>
                        <Text className="text-xl font-semibold text-white">{formatCareerHours(totals.remaining)} hrs</Text>
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
                <Text className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Hour Summary</Text>
                <Pressable className="flex-row items-center gap-1">
                  <FontAwesome name="info-circle" size={14} color="#2563eb" />
                  <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">DGCA Requirements</Text>
                </Pressable>
              </View>

              <View className="mb-1 flex-row flex-wrap justify-between">
                <RequirementCard
                  title="Solo PIC"
                  minimumLabel="Logged solo PIC"
                  currentMinutes={summary.soloPic}
                  accentColor="#2563eb"
                  icon="user"
                />
                <RequirementCard
                  title="Cross Country"
                  minimumLabel="Minimum 50 hrs"
                  currentMinutes={summary.crossCountry}
                  targetMinutes={CAREER_TARGETS.crossCountry}
                  accentColor="#14b8a6"
                  icon="location-arrow"
                />
                <RequirementCard
                  title="Instrument Flying"
                  minimumLabel="Minimum 20 hrs"
                  currentMinutes={summary.instrumentBreakdown.total}
                  targetMinutes={CAREER_TARGETS.instrument}
                  accentColor="#ea580c"
                  icon="dot-circle-o"
                />
                <RequirementCard
                  title="Dual"
                  minimumLabel="No fixed limit"
                  currentMinutes={summary.dual}
                  accentColor="#7c3aed"
                  icon="users"
                />
                <RequirementCard
                  title="General Flying"
                  minimumLabel="PIC / instructor time"
                  currentMinutes={summary.generalFlying}
                  accentColor="#ca8a04"
                  icon="fighter-jet"
                />
                <RequirementCard
                  title="PIC"
                  minimumLabel="Minimum 100 hrs"
                  currentMinutes={summary.pic.total}
                  targetMinutes={CAREER_TARGETS.pic}
                  accentColor="#0d9488"
                  icon="plane"
                />
              </View>

              <DetailRequirementCard
                title="Checks"
                subtitle="Examiner flights — 250, 120, day, night, IRT, night PIC"
                icon="check-circle"
                accentColor="#2563eb"
              >
                <DetailRow label="250" minutes={summary.checks.hour250} />
                <DetailRow label="120" minutes={summary.checks.hour120} />
                <DetailRow label="Day" minutes={summary.checks.day} />
                <DetailRow label="Night" minutes={summary.checks.night} />
                <DetailRow label="IRT" minutes={summary.checks.irt} />
                <DetailRow label="Night PIC" minutes={summary.checks.nightPic} />
              </DetailRequirementCard>

              <DetailRequirementCard
                title="PIC Breakdown"
                subtitle="XC, 250, 120, GFT (day, night, IRT, night PIC)"
                icon="user"
                accentColor="#0d9488"
              >
                <DetailRow label="XC" minutes={summary.pic.xc} />
                <DetailRow label="250" minutes={summary.pic.hour250} />
                <DetailRow label="120" minutes={summary.pic.hour120} />
                <Text className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">GFT</Text>
                <DetailRow label="Day" minutes={summary.pic.gft.day} />
                <DetailRow label="Night" minutes={summary.pic.gft.night} />
                <DetailRow label="IRT" minutes={summary.pic.gft.irt} />
                <DetailRow label="Night PIC" minutes={summary.pic.gft.nightPic} />
              </DetailRequirementCard>

              <DetailRequirementCard
                title="Instrument Flying"
                subtitle={`Total ${formatCareerHours(summary.instrumentBreakdown.total)} — IF vs dual`}
                icon="dot-circle-o"
                accentColor="#ea580c"
              >
                <DetailRow label="IF" minutes={summary.instrumentBreakdown.ifActual} />
                <DetailRow label="Dual" minutes={summary.instrumentBreakdown.ifDual} />
              </DetailRequirementCard>

              <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                      <FontAwesome name="plane" size={18} color="#2563eb" />
                    </View>
                    <View>
                      <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">CPL Total (All Requirements)</Text>
                      <Text className="text-sm text-slate-500 dark:text-slate-400">Minimum 200 hrs</Text>
                    </View>
                  </View>
                  <View className="rounded-lg bg-slate-100 px-3 py-1 dark:bg-slate-800">
                    <Text className="text-base font-semibold text-blue-700 dark:text-blue-300">{totals.progress}%</Text>
                  </View>
                </View>
                <View className="mt-2 flex-row items-end justify-center">
                  <Text className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCareerHours(totals.total)}</Text>
                  <Text className="mb-0.5 ml-2 text-base font-medium text-slate-500 dark:text-slate-400">
                    / {formatCareerHours(CAREER_TARGETS.total)}
                  </Text>
                </View>
                <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <View className="h-full rounded-full bg-blue-500" style={{ width: `${totals.progress}%` }} />
                </View>
              </View>

              <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                      <FontAwesome name="calendar" size={18} color="#2563eb" />
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="text-xl font-semibold text-slate-900 dark:text-slate-100">Buffer Time Left</Text>
                      <Text className="text-sm text-slate-600 dark:text-slate-400">
                        You have approximately 11 Months 14 Days left to complete CPL.
                      </Text>
                    </View>
                  </View>
                  <Pressable className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <Text className="font-medium text-blue-700 dark:text-blue-300">View Projection</Text>
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
