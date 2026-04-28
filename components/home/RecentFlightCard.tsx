import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
import { RecentFlight } from './types';

type RecentFlightCardProps = {
  flight: RecentFlight;
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

export function RecentFlightCard({ flight }: RecentFlightCardProps) {
  return (
    <View className="mx-5 mb-3 rounded-2xl border border-blue-100 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row">
        <View className="w-14 items-center border-r border-slate-100 pr-2 dark:border-slate-700">
          <Text className="text-4xl font-bold text-blue-700">{flight.day}</Text>
          <Text className="text-sm font-bold uppercase text-blue-600">{flight.month}</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">{flight.year}</Text>
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <FontAwesome name="plane" size={16} color="#2563eb" />
              </View>
              <Text className="text-3xl font-bold text-slate-800 dark:text-slate-100">{flight.aircraft}</Text>
              <View className="rounded-full bg-blue-50 px-2 py-0.5 dark:bg-blue-900/30">
                <Text className="text-xs font-semibold text-blue-700">{flight.aircraftTag}</Text>
              </View>
            </View>
            <FontAwesome name="angle-right" size={20} color="#94a3b8" />
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-700 dark:text-slate-200">
              {flight.routeFrom} <Text className="text-slate-400 dark:text-slate-500">→</Text> {flight.routeTo}
            </Text>
            <View className="flex-row items-center gap-1">
              <FontAwesome name="clock-o" size={14} color="#1d4ed8" />
              <Text className="text-lg font-bold text-blue-700">{flight.duration}</Text>
            </View>
          </View>

          <View className="mt-1 flex-row items-center gap-2">
            <FontAwesome name="user-o" size={12} color="#64748b" />
            <Text className="text-sm text-slate-500 dark:text-slate-400">{flight.pilotName}</Text>
            <View className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <Text className="text-sm text-slate-500 dark:text-slate-400">{flight.coPilotName}</Text>
          </View>
        </View>
      </View>

      <View className="mt-3 h-px bg-slate-100 dark:bg-slate-800" />
      <View className="mt-2 flex-row items-center justify-around">
        <FooterStat icon="fighter-jet" label="Landings" value={flight.landings} />
        <View className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <FooterStat icon="send-o" label="Takeoffs" value={flight.takeoffs} />
        <View className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <FooterStat icon="wrench" label="Go Around" value={flight.goArounds} />
      </View>
    </View>
  );
}
