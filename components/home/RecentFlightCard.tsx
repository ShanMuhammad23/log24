import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';
import { RecentFlight } from './types';

type RecentFlightCardProps = {
  flight: RecentFlight;
  onPress?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectionToggle?: () => void;
};

function FooterStat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <FontAwesome name={icon as any} size={12} color="#94a3b8" />
      <Text className="text-xs text-slate-600 dark:text-slate-300">
        <Text className="font-semibold">{value}</Text> {label}
      </Text>
    </View>
  );
}

export function RecentFlightCard({
  flight,
  onPress,
  selectionMode = false,
  selected = false,
  onSelectionToggle,
}: RecentFlightCardProps) {
  const handlePress = selectionMode ? onSelectionToggle : onPress;

  return (
    <Pressable
      onPress={handlePress}
      className={`mx-5 mb-3 rounded-2xl border px-3 py-2.5 ${
        selectionMode && selected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
          : 'border-blue-100 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}>
      <View className="flex-row">
        {selectionMode ? (
          <View className="mr-2.5 items-center justify-center">
            <View
              className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
              }`}>
              {selected ? <FontAwesome name="check" size={12} color="#ffffff" /> : null}
            </View>
          </View>
        ) : null}
        <View className="w-12 items-center border-r border-slate-100 pr-2 dark:border-slate-700">
          <Text className="text-3xl font-semibold text-blue-700">{flight.day}</Text>
          <Text className="text-xs font-semibold uppercase text-blue-600">{flight.month}</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">{flight.year}</Text>
        </View>

        <View className="ml-2.5 flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                <FontAwesome name="plane" size={14} color="#2563eb" />
              </View>
              <Text className="text-lg font-semibold text-slate-800 dark:text-slate-100">{flight.aircraftTag}</Text>
              <View className="rounded-full bg-blue-50 px-2 py-0.5 dark:bg-blue-900/30">
                <Text className="text-[11px] font-medium text-blue-700">{flight.aircraft}</Text>
              </View>
            </View>
            {selectionMode ? null : <FontAwesome name="angle-right" size={18} color="#94a3b8" />}
          </View>

          <View className="mt-0.5 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              {flight.routeFrom} <Text className="text-slate-400 dark:text-slate-500">→</Text> {flight.routeTo}
            </Text>
            <View className="flex-row items-center gap-1">
              <FontAwesome name="clock-o" size={13} color="#1d4ed8" />
              <Text className="text-base font-semibold text-blue-700">{flight.duration}</Text>
            </View>
          </View>

          <View className="mt-0.5 flex-row items-center gap-2">
            <FontAwesome name="user-o" size={11} color="#64748b" />
            <Text className="text-xs text-slate-500 dark:text-slate-400">{flight.pilotName}</Text>
            <View className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <Text className="text-xs text-slate-500 dark:text-slate-400">{flight.coPilotName}</Text>
          </View>
        </View>
      </View>

      <View className="mt-2.5 h-px bg-slate-100 dark:bg-slate-800" />
      <View className="mt-1.5 flex-row items-center justify-around">
        <FooterStat icon="fighter-jet" label="Landings" value={flight.landings} />
        <View className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <FooterStat icon="send-o" label="Takeoffs" value={flight.takeoffs} />
        <View className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <FooterStat icon="wrench" label="Go Around" value={flight.goArounds} />
      </View>
    </Pressable>
  );
}
