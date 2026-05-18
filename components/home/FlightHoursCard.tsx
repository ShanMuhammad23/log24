import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
import { FlightMetric } from './types';

type FlightHoursCardProps = {
  totalHours: string;
  metrics: FlightMetric[];
};

function MetricCell({ metric, showDivider }: { metric: FlightMetric; showDivider: boolean }) {
  return (
    <View className="flex-1 flex-row">
      {showDivider ? <View className="mr-2 w-px self-stretch bg-blue-400/70" /> : null}
      <View className="flex-1 px-1">
        <View className="mb-2 flex-row items-center gap-1.5">
          <FontAwesome name={metric.icon as any} size={13} color="#bfdbfe" />
          <Text className="flex-1 text-[10px] font-semibold uppercase leading-tight text-blue-100" numberOfLines={2}>
            {metric.label}
          </Text>
        </View>
        <Text className="text-lg font-bold text-white">{metric.value}</Text>
        <Text className="text-sm font-semibold text-blue-100">{metric.unit}</Text>
      </View>
    </View>
  );
}

export function FlightHoursCard({ totalHours, metrics }: FlightHoursCardProps) {
  return (
    <View className="mx-5 rounded-3xl bg-blue-700 px-5 py-5 shadow-lg shadow-blue-400/50">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-semibold uppercase tracking-wide text-blue-100">Total Flight Hours</Text>
        <FontAwesome name="plane" size={20} color="#93c5fd" />
      </View>
      <View className="mb-4 flex-row items-end">
        <Text className="text-5xl font-extrabold text-white">{totalHours}</Text>
        <Text className="mb-2 ml-2 text-base font-bold text-blue-100">HRS</Text>
      </View>
      <View className="h-px bg-blue-500" />
      <View className="mt-4 flex-row">
        {metrics.map((metric, index) => (
          <MetricCell key={metric.key} metric={metric} showDivider={index > 0} />
        ))}
      </View>
    </View>
  );
}
