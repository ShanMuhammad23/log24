import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MetarReport } from '@/utils/aviation-weather';

function formatFieldValue(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function RawBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </Text>
      <View className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/80">
        <Text className="font-mono text-sm leading-5 text-slate-800 dark:text-slate-100">{value || '—'}</Text>
      </View>
    </View>
  );
}

function DecodedField({ label, value }: { label: string; value: unknown }) {
  return (
    <View className="mb-2.5 border-b border-slate-200 pb-2.5 last:mb-0 last:border-b-0 last:pb-0 dark:border-slate-800">
      <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
        {label}
      </Text>
      <Text className="mt-1 font-mono text-sm leading-5 text-slate-800 dark:text-slate-100">
        {formatFieldValue(value)}
      </Text>
    </View>
  );
}

type MetarReportCardProps = {
  report: MetarReport;
  index: number;
};

export function MetarReportCard({ report, index }: MetarReportCardProps) {
  const [decoded, setDecoded] = useState(false);

  return (
    <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">{report.name}</Text>
          {report.metarType ? (
            <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{report.metarType}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setDecoded((prev) => !prev)}
          className="rounded-lg bg-blue-600 px-3 py-2 active:bg-blue-700">
          <Text className="text-sm font-semibold text-white">{decoded ? 'Hide' : 'Decode'}</Text>
        </Pressable>
      </View>

      <RawBlock label="METAR" value={report.rawOb} />
      {report.rawTaf ? <RawBlock label="TAF" value={report.rawTaf} /> : null}

      {decoded ? (
        <View className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
          <Text className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Decoded fields</Text>
          {Object.entries(report).map(([key, value]) => (
            <DecodedField key={key} label={key} value={value} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
