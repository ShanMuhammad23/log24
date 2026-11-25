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

function LedgerStat({ value, label, showDivider }: { value: number; label: string; showDivider: boolean }) {
  return (
    <View className={`flex-1 flex-row items-baseline justify-center gap-1.5 ${showDivider ? 'border-l border-rule dark:border-ruleDark' : ''}`}>
      <Text className="text-sm font-bold text-ink dark:text-white">{value}</Text>
      <Text className="text-xs text-sub dark:text-mist">{label}</Text>
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
      className={`mx-5 mb-2 rounded-lg border px-4 py-3 ${
        selectionMode && selected
          ? 'border-arc bg-arc/10 dark:border-arc dark:bg-arc/10'
          : 'border-rule bg-white dark:border-ruleDark dark:bg-panel'
      }`}>
      <View className="flex-row">
        {selectionMode ? (
          <View className="mr-3 items-center justify-center">
            <View
              className={`h-5 w-5 items-center justify-center rounded border ${
                selected ? 'border-arc bg-arc' : 'border-rule bg-white dark:border-ruleDark dark:bg-panel'
              }`}>
              {selected ? <FontAwesome name="check" size={11} color="#0A1428" /> : null}
            </View>
          </View>
        ) : null}

        <View className="w-11">
          <Text className="text-2xl font-bold leading-tight text-ink dark:text-white">{flight.day}</Text>
          <Text className="text-[11px] font-medium text-sub dark:text-mist">
            {flight.month} {flight.year}
          </Text>
        </View>
        <View className="mx-3.5 w-px self-stretch bg-rule dark:bg-ruleDark" />

        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="flex-1 text-base text-ink dark:text-white" numberOfLines={1}>
              <Text className="font-bold">{flight.aircraftTag}</Text>
              {flight.aircraft !== '-' ? <Text className="text-sub dark:text-mist">  {flight.aircraft}</Text> : null}
            </Text>
            <Text className="ml-3 text-base font-bold text-ink dark:text-white">{flight.duration}</Text>
          </View>

          <View className="mt-0.5 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-sub dark:text-mist">
              {flight.routeFrom} → {flight.routeTo}
            </Text>
            <Text className="text-xs text-sub dark:text-mist" numberOfLines={1}>
              {flight.pilotName}
            </Text>
          </View>
        </View>
      </View>

      <View className="mb-2 mt-2.5 h-px bg-rule dark:bg-ruleDark" />
      <View className="flex-row">
        <LedgerStat value={flight.takeoffs} label="takeoffs" showDivider={false} />
        <LedgerStat value={flight.landings} label="landings" showDivider />
        <LedgerStat value={flight.goArounds} label="go-arounds" showDivider />
      </View>
    </Pressable>
  );
}
