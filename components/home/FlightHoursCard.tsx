import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ARC } from '@/constants/Colors';
import { FlightMetric } from './types';

type FlightHoursCardProps = {
  totalHours: string;
  metrics: FlightMetric[];
  onPress?: () => void;
};

/** The L24 dial motif — an open arc, like the mark on the app icon. */
function ArcMark({ size = 34 }: { size?: number }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={ARC}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c * 0.72} ${c}`}
        transform={`rotate(140 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function MetricCell({ metric, showDivider }: { metric: FlightMetric; showDivider: boolean }) {
  return (
    <View className={`flex-1 ${showDivider ? 'border-l border-ruleDark pl-3' : ''}`}>
      <Text className="text-[11px] font-medium leading-tight text-mist" numberOfLines={2}>
        {metric.label}
      </Text>
      <View className="mt-1 flex-row items-baseline">
        <Text className="text-lg font-bold text-white">{metric.value}</Text>
        <Text className="ml-1 text-[11px] font-medium text-mist">{metric.unit.toLowerCase()}</Text>
      </View>
    </View>
  );
}

export function FlightHoursCard({ totalHours, metrics, onPress }: FlightHoursCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mx-5 rounded-xl border border-ruleDark bg-night px-5 pb-5 pt-4 active:opacity-95">
      <View className="flex-row items-start justify-between">
        <Text className="text-sm font-medium text-mist">Total flight hours</Text>
        <ArcMark />
      </View>
      <View className="mt-1 flex-row items-end">
        <Text className="font-familjen-bold text-6xl leading-none text-white">{totalHours}</Text>
        <Text className="mb-1.5 ml-2 text-base font-semibold text-mist">hrs</Text>
      </View>
      <View className="mb-4 mt-4 h-px bg-ruleDark" />
      <View className="flex-row gap-3">
        {metrics.map((metric, index) => (
          <MetricCell key={metric.key} metric={metric} showDivider={index > 0} />
        ))}
      </View>
    </Pressable>
  );
}
