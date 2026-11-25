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
      <Text className="mb-1 text-xs font-semibold text-sub dark:text-mist">{label}</Text>
      <View className="rounded-md border border-rule bg-paper p-3 dark:border-ruleDark dark:bg-night">
        <Text className="font-mono text-sm leading-5 text-ink dark:text-white">{value || '—'}</Text>
      </View>
    </View>
  );
}

function DecodedField({ label, value }: { label: string; value: unknown }) {
  return (
    <View className="mb-2.5 border-b border-rule pb-2.5 last:mb-0 last:border-b-0 last:pb-0 dark:border-ruleDark">
      <Text className="text-[11px] font-semibold text-arcDeep dark:text-arc">{label}</Text>
      <Text className="mt-1 font-mono text-sm leading-5 text-ink dark:text-white">
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
    <View className="mb-4 rounded-lg border border-rule bg-white p-4 dark:border-ruleDark dark:bg-panel">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-ink dark:text-white">{report.name}</Text>
          {report.metarType ? (
            <Text className="mt-0.5 text-xs text-sub dark:text-mist">{report.metarType}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setDecoded((prev) => !prev)}
          className="rounded-md border border-rule px-3 py-1.5 active:bg-paper dark:border-ruleDark dark:active:bg-night">
          <Text className="text-sm font-semibold text-arcDeep dark:text-arc">
            {decoded ? 'Hide' : 'Decode'}
          </Text>
        </Pressable>
      </View>

      <RawBlock label="METAR" value={report.rawOb} />
      {report.rawTaf ? <RawBlock label="TAF" value={report.rawTaf} /> : null}

      {decoded ? (
        <View className="mt-1 rounded-md border border-rule bg-paper p-3 dark:border-ruleDark dark:bg-night">
          <Text className="mb-2 text-sm font-semibold text-sub dark:text-mist">Decoded fields</Text>
          {Object.entries(report).map(([key, value]) => (
            <DecodedField key={key} label={key} value={value} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
