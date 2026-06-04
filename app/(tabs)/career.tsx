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
  HOUR_SUMMARY_TARGETS,
} from '@/utils/career';

function percentFromMinutes(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function ColumnSummaryHeader({
  title,
  currentMinutes,
  targetMinutes,
  accentColor,
}: {
  title: string;
  currentMinutes: number;
  targetMinutes: number;
  accentColor: string;
}) {
  const progress = percentFromMinutes(currentMinutes, targetMinutes);

  return (
    <View className="mb-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900">
      <Text className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        {title}
      </Text>
      <View className="mt-1 flex-row items-end justify-center">
        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {formatCareerHours(currentMinutes)}
        </Text>
        <Text className="mb-px ml-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          / {formatCareerHours(targetMinutes)}
        </Text>
      </View>
      <View className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
      </View>
      <Text className="mt-0.5 text-center text-[10px] font-semibold" style={{ color: accentColor }}>
        {progress}%
      </Text>
    </View>
  );
}

function RequirementCard({
  title,
  minimumLabel,
  currentMinutes,
  targetMinutes,
  accentColor,
  icon,
  fullWidth,
}: {
  title: string;
  minimumLabel: string;
  currentMinutes: number;
  targetMinutes?: number;
  accentColor: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  fullWidth?: boolean;
}) {
  const hasTarget = targetMinutes != null && targetMinutes > 0;
  const progress = hasTarget ? percentFromMinutes(currentMinutes, targetMinutes) : 0;

  return (
    <View
      className={`rounded-xl border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900 ${
        fullWidth ? 'mb-1 w-full' : 'mb-3 w-[48.5%]'
      }`}>
      <View className="flex-row items-center gap-1.5">
        <View
          className="h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}20` }}>
          <FontAwesome name={icon} size={12} color={accentColor} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-semibold text-slate-900 dark:text-slate-100" numberOfLines={1}>
            {title}
          </Text>
          {minimumLabel ? (
            <Text className="text-[10px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
              {minimumLabel}
            </Text>
          ) : null}
        </View>
        <View className="shrink-0 items-end">
          <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatCareerHours(currentMinutes)}
          </Text>
          {hasTarget ? (
            <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              / {formatCareerHours(targetMinutes!)}
            </Text>
          ) : null}
        </View>
      </View>

      {hasTarget ? (
        <View className="mt-1 flex-row items-center gap-1">
          <View className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
          </View>
          <Text className="text-[10px] font-semibold" style={{ color: accentColor }}>
            {progress}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type BreakdownTableRow =
  | { type: 'data'; label: string; minutes: number }
  | { type: 'section'; label: string };

function BreakdownTableSection({
  title,
  subtitle,
  icon,
  accentColor,
  rows,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  accentColor: string;
  rows: BreakdownTableRow[];
}) {
  return (
    <View className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <View
        className="flex-row items-center gap-1.5 border-b border-slate-200 px-2 py-1.5 dark:border-slate-700"
        style={{ backgroundColor: `${accentColor}12` }}>
        <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}25` }}>
          <FontAwesome name={icon} size={11} color={accentColor} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
          {subtitle ? (
            <Text className="text-[10px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row border-b border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-700 dark:bg-slate-800/80">
        <Text className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Category
        </Text>
        <Text className="w-[52px] text-right text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Hours
        </Text>
      </View>

      {rows.map((row, index) => {
        if (row.type === 'section') {
          return (
            <View
              key={`${row.label}-${index}`}
              className="border-b border-slate-100 bg-slate-50 px-2 py-1 dark:border-slate-800 dark:bg-slate-800/50">
              <Text className="text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-400">
                {row.label}
              </Text>
            </View>
          );
        }

        const isLast = index === rows.length - 1;
        return (
          <View
            key={`${row.label}-${index}`}
            className={`flex-row items-center px-2 py-1 ${isLast ? '' : 'border-b border-slate-100 dark:border-slate-800'}`}>
            <Text className="flex-1 text-xs text-slate-700 dark:text-slate-300">{row.label}</Text>
            <Text className="w-[52px] text-right text-xs font-semibold text-slate-900 dark:text-slate-100">
              {formatCareerHours(row.minutes)}
            </Text>
          </View>
        );
      })}
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

              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-slate-900 dark:text-slate-100">Hour Summary</Text>
                <Pressable className="flex-row items-center gap-1">
                  <FontAwesome name="info-circle" size={14} color="#2563eb" />
                  <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">DGCA Requirements</Text>
                </Pressable>
              </View>

              <View className="mb-2 flex-row items-start gap-1.5">
                <View className="flex-1">
                  <ColumnSummaryHeader
                    title="Solo PIC"
                    currentMinutes={summary.hourSummary.soloPic.total}
                    targetMinutes={HOUR_SUMMARY_TARGETS.soloPic}
                    accentColor="#2563eb"
                  />
                  <RequirementCard
                    fullWidth
                    title="Cross Country"
                    minimumLabel=""
                    currentMinutes={summary.hourSummary.soloPic.crossCountry}
                    targetMinutes={HOUR_SUMMARY_TARGETS.soloCrossCountry}
                    accentColor="#14b8a6"
                    icon="location-arrow"
                  />
                  <RequirementCard
                    fullWidth
                    title="CCTS"
                    minimumLabel=""
                    currentMinutes={summary.hourSummary.soloPic.ccts}
                    targetMinutes={HOUR_SUMMARY_TARGETS.ccts}
                    accentColor="#2563eb"
                    icon="graduation-cap"
                  />
                  <RequirementCard
                    fullWidth
                    title="GFT"
                    minimumLabel=""
                    currentMinutes={summary.hourSummary.soloPic.gft}
                    targetMinutes={HOUR_SUMMARY_TARGETS.gft}
                    accentColor="#0d9488"
                    icon="check-circle"
                  />
                  <RequirementCard
                    fullWidth
                    title="Multi Checks"
                    minimumLabel=""
                    currentMinutes={summary.hourSummary.soloPic.multiChecks}
                    targetMinutes={HOUR_SUMMARY_TARGETS.multiChecks}
                    accentColor="#ca8a04"
                    icon="list-alt"
                  />
                  <RequirementCard
                    fullWidth
                    title="Night"
                    minimumLabel=""
                    currentMinutes={summary.hourSummary.soloPic.night}
                    targetMinutes={HOUR_SUMMARY_TARGETS.night}
                    accentColor="#6366f1"
                    icon="moon-o"
                  />
                </View>

                <View className="flex-1">
                  <ColumnSummaryHeader
                    title="Dual"
                    currentMinutes={summary.hourSummary.dual.total}
                    targetMinutes={HOUR_SUMMARY_TARGETS.dual}
                    accentColor="#7c3aed"
                  />
                  <RequirementCard
                    fullWidth
                    title="IF"
                    minimumLabel="/ 20 Hr"
                    currentMinutes={summary.hourSummary.dual.instrument}
                    targetMinutes={HOUR_SUMMARY_TARGETS.dualIf}
                    accentColor="#ea580c"
                    icon="dot-circle-o"
                  />
                  <RequirementCard
                    fullWidth
                    title="Multi"
                    minimumLabel=""
                    currentMinutes={summary.hourSummary.dual.multi}
                    targetMinutes={HOUR_SUMMARY_TARGETS.dualMulti}
                    accentColor="#7c3aed"
                    icon="plane"
                  />
                  <RequirementCard
                    fullWidth
                    title="Night"
                    minimumLabel=""
                    currentMinutes={summary.hourSummary.dual.night}
                    targetMinutes={HOUR_SUMMARY_TARGETS.dualNight}
                    accentColor="#6366f1"
                    icon="moon-o"
                  />
                  <RequirementCard
                    fullWidth
                    title="Extra / Other"
                    minimumLabel="Not fixed"
                    currentMinutes={summary.hourSummary.dual.extra}
                    accentColor="#64748b"
                    icon="ellipsis-h"
                  />
                </View>
              </View>

              <Text className="mb-2 mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Flight Breakdown</Text>

              <BreakdownTableSection
                title="Checks"
                subtitle="Examiner flights"
                icon="check-circle"
                accentColor="#2563eb"
                rows={[
                  { type: 'data', label: '250', minutes: summary.checks.hour250 },
                  { type: 'data', label: '120', minutes: summary.checks.hour120 },
                  { type: 'data', label: 'Day', minutes: summary.checks.day },
                  { type: 'data', label: 'Night', minutes: summary.checks.night },
                  { type: 'data', label: 'IRT', minutes: summary.checks.irt },
                  { type: 'data', label: 'Night PIC', minutes: summary.checks.nightPic },
                ]}
              />

              <BreakdownTableSection
                title="PIC Logbook"
                subtitle="From PIC log entries"
                icon="user"
                accentColor="#0d9488"
                rows={[
                  { type: 'data', label: 'CCTS Day', minutes: summary.pic.breakdown.cctsDay },
                  { type: 'data', label: 'CCTS Night', minutes: summary.pic.breakdown.cctsNight },
                  { type: 'data', label: 'XCTY', minutes: summary.pic.breakdown.xcty },
                  { type: 'data', label: 'Night', minutes: summary.pic.breakdown.night },
                  { type: 'section', label: 'GFT Checks' },
                  { type: 'data', label: '300 NM (GFT)', minutes: summary.pic.breakdown.gft300nm },
                  { type: 'data', label: '250 NM', minutes: summary.pic.breakdown.gft250nm },
                  { type: 'data', label: '120 NM', minutes: summary.pic.breakdown.gft120nm },
                  { type: 'data', label: 'Day', minutes: summary.pic.breakdown.gftDay },
                  { type: 'data', label: 'Night', minutes: summary.pic.breakdown.gftNight },
                  { type: 'section', label: 'Multi Checks' },
                  { type: 'data', label: 'Day', minutes: summary.pic.breakdown.multiDay },
                  { type: 'data', label: 'Night', minutes: summary.pic.breakdown.multiNight },
                  { type: 'data', label: 'IRT', minutes: summary.pic.breakdown.multiIrt },
                ]}
              />

              <BreakdownTableSection
                title="PIC Breakdown"
                subtitle="XC, 250, 120, GFT"
                icon="user"
                accentColor="#0d9488"
                rows={[
                  { type: 'data', label: 'XC', minutes: summary.pic.xc },
                  { type: 'data', label: '250', minutes: summary.pic.hour250 },
                  { type: 'data', label: '120', minutes: summary.pic.hour120 },
                  { type: 'section', label: 'GFT' },
                  { type: 'data', label: 'Day', minutes: summary.pic.gft.day },
                  { type: 'data', label: 'Night', minutes: summary.pic.gft.night },
                  { type: 'data', label: 'IRT', minutes: summary.pic.gft.irt },
                  { type: 'data', label: 'Night PIC', minutes: summary.pic.gft.nightPic },
                ]}
              />

              <BreakdownTableSection
                title="Instrument Flying"
                subtitle={`Total ${formatCareerHours(summary.instrumentBreakdown.total)}`}
                icon="dot-circle-o"
                accentColor="#ea580c"
                rows={[
                  { type: 'data', label: 'IF', minutes: summary.instrumentBreakdown.ifActual },
                  { type: 'data', label: 'Dual', minutes: summary.instrumentBreakdown.ifDual },
                ]}
              />

              <BreakdownTableSection
                title="Dual Breakdown"
                subtitle={`Total ${formatCareerHours(summary.dualBreakdown.total)}`}
                icon="users"
                accentColor="#7c3aed"
                rows={[
                  { type: 'data', label: 'Extra / Other', minutes: summary.dualBreakdown.extra },
                  { type: 'data', label: 'Night', minutes: summary.dualBreakdown.night },
                  { type: 'data', label: 'IF', minutes: summary.dualBreakdown.instrument },
                  { type: 'data', label: 'Multi', minutes: summary.dualBreakdown.multi },
                ]}
              />

            </>
          )}
        </ScrollView>

        <FloatingLogButton />
      </View>
    </SafeAreaView>
  );
}
