import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { formatDuration, toMinutes } from '@/utils/flight-form';
import type { PicBreakdownFormState, PicCctsPeriod } from '@/utils/pic-breakdown';

function TimeInput({
  value,
  onChangeText,
  blockMinutes,
}: {
  value: string;
  onChangeText: (value: string) => void;
  blockMinutes: number | null;
}) {
  const exceedsBlock =
    blockMinutes !== null &&
    blockMinutes > 0 &&
    (() => {
      const minutes = toMinutes(value);
      return minutes !== null && minutes > blockMinutes;
    })();

  return (
    <View className="mt-2">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="HH:MM"
        placeholderTextColor="#64748b"
        keyboardType="numeric"
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      {blockMinutes !== null && blockMinutes > 0 ? (
        <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Max {formatDuration(blockMinutes)} (block time)
        </Text>
      ) : null}
      {exceedsBlock ? (
        <Text className="mt-1 text-xs text-red-400">Cannot exceed block time.</Text>
      ) : null}
    </View>
  );
}

function CategoryToggle({
  label,
  hint,
  enabled,
  onEnabledChange,
  children,
}: {
  label: string;
  hint?: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <View className="mb-4 last:mb-0">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Text>
          {hint ? <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</Text> : null}
        </View>
        <Switch
          value={enabled}
          onValueChange={onEnabledChange}
          trackColor={{ false: '#475569', true: '#2563eb' }}
        />
      </View>
      {enabled ? <View className="mt-2">{children}</View> : null}
    </View>
  );
}

function SubCategoryToggle({
  label,
  hint,
  enabled,
  onEnabledChange,
  time,
  onTimeChange,
  blockMinutes,
}: {
  label: string;
  hint?: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  time: string;
  onTimeChange: (value: string) => void;
  blockMinutes: number | null;
}) {
  return (
    <View className="mb-3 ml-2 border-l-2 border-slate-200 pl-3 last:mb-0 dark:border-slate-700">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm text-slate-700 dark:text-slate-200">{label}</Text>
          {hint ? <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</Text> : null}
        </View>
        <Switch
          value={enabled}
          onValueChange={onEnabledChange}
          trackColor={{ false: '#475569', true: '#2563eb' }}
        />
      </View>
      {enabled ? <TimeInput value={time} onChangeText={onTimeChange} blockMinutes={blockMinutes} /> : null}
    </View>
  );
}

function PeriodButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-xl border px-4 py-2.5 ${
        selected
          ? 'border-blue-600 bg-blue-600'
          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950'
      }`}>
      <Text
        className={`text-sm font-semibold ${
          selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

type PicBreakdownSectionProps = {
  value: PicBreakdownFormState;
  onChange: (value: PicBreakdownFormState) => void;
  blockMinutes: number | null;
};

export function PicBreakdownSection({ value, onChange, blockMinutes }: PicBreakdownSectionProps) {
  const patch = (partial: Partial<PicBreakdownFormState>) => onChange({ ...value, ...partial });

  const setCctsPeriod = (period: PicCctsPeriod) => {
    patch({ cctsPeriod: period });
  };

  return (
    <View>
      <CategoryToggle
        label="CCTS (30 Hr)"
        enabled={value.cctsEnabled}
        onEnabledChange={(enabled) =>
          patch({
            cctsEnabled: enabled,
            cctsPeriod: enabled ? value.cctsPeriod : null,
            cctsTime: enabled ? value.cctsTime : '',
          })
        }>
        <View className="flex-row gap-2">
          <PeriodButton
            label="Day"
            selected={value.cctsPeriod === 'day'}
            onPress={() => setCctsPeriod('day')}
          />
          <PeriodButton
            label="Night"
            selected={value.cctsPeriod === 'night'}
            onPress={() => setCctsPeriod('night')}
          />
        </View>
        {value.cctsPeriod ? (
          <TimeInput value={value.cctsTime} onChangeText={(cctsTime) => patch({ cctsTime })} blockMinutes={blockMinutes} />
        ) : (
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">Select Day or Night, then enter hours.</Text>
        )}
      </CategoryToggle>

      <CategoryToggle
        label="XCTY (50 Hr)"
        enabled={value.xctyEnabled}
        onEnabledChange={(xctyEnabled) =>
          patch({ xctyEnabled, xctyTime: xctyEnabled ? value.xctyTime : '' })
        }>
        <TimeInput value={value.xctyTime} onChangeText={(xctyTime) => patch({ xctyTime })} blockMinutes={blockMinutes} />
      </CategoryToggle>

      <CategoryToggle
        label="Night"
        enabled={value.nightCategoryEnabled}
        onEnabledChange={(nightCategoryEnabled) =>
          patch({
            nightCategoryEnabled,
            nightCategoryTime: nightCategoryEnabled ? value.nightCategoryTime : '',
          })
        }>
        <TimeInput
          value={value.nightCategoryTime}
          onChangeText={(nightCategoryTime) => patch({ nightCategoryTime })}
          blockMinutes={blockMinutes}
        />
      </CategoryToggle>

      <CategoryToggle
        label="GFT Checks (8 Hr)"
        enabled={value.gftChecksEnabled}
        onEnabledChange={(gftChecksEnabled) =>
          patch({
            gftChecksEnabled,
            gft300nmEnabled: gftChecksEnabled ? value.gft300nmEnabled : false,
            gft250nmEnabled: gftChecksEnabled ? value.gft250nmEnabled : false,
            gft120nmEnabled: gftChecksEnabled ? value.gft120nmEnabled : false,
            gftDayEnabled: gftChecksEnabled ? value.gftDayEnabled : false,
            gftNightEnabled: gftChecksEnabled ? value.gftNightEnabled : false,
          })
        }>
        <SubCategoryToggle
          label="300 NM (GFT)"
          hint="4–5 Hr — counts toward cross country"
          enabled={value.gft300nmEnabled}
          onEnabledChange={(gft300nmEnabled) =>
            patch({ gft300nmEnabled, gft300nmTime: gft300nmEnabled ? value.gft300nmTime : '' })
          }
          time={value.gft300nmTime}
          onTimeChange={(gft300nmTime) => patch({ gft300nmTime })}
          blockMinutes={blockMinutes}
        />
        <SubCategoryToggle
          label="250 NM"
          hint="3 1/2 Hr"
          enabled={value.gft250nmEnabled}
          onEnabledChange={(gft250nmEnabled) =>
            patch({ gft250nmEnabled, gft250nmTime: gft250nmEnabled ? value.gft250nmTime : '' })
          }
          time={value.gft250nmTime}
          onTimeChange={(gft250nmTime) => patch({ gft250nmTime })}
          blockMinutes={blockMinutes}
        />
        <SubCategoryToggle
          label="120 NM"
          hint="2 1/2 Hr"
          enabled={value.gft120nmEnabled}
          onEnabledChange={(gft120nmEnabled) =>
            patch({ gft120nmEnabled, gft120nmTime: gft120nmEnabled ? value.gft120nmTime : '' })
          }
          time={value.gft120nmTime}
          onTimeChange={(gft120nmTime) => patch({ gft120nmTime })}
          blockMinutes={blockMinutes}
        />
        <SubCategoryToggle
          label="Day"
          enabled={value.gftDayEnabled}
          onEnabledChange={(gftDayEnabled) =>
            patch({ gftDayEnabled, gftDayTime: gftDayEnabled ? value.gftDayTime : '' })
          }
          time={value.gftDayTime}
          onTimeChange={(gftDayTime) => patch({ gftDayTime })}
          blockMinutes={blockMinutes}
        />
        <SubCategoryToggle
          label="Night"
          enabled={value.gftNightEnabled}
          onEnabledChange={(gftNightEnabled) =>
            patch({ gftNightEnabled, gftNightTime: gftNightEnabled ? value.gftNightTime : '' })
          }
          time={value.gftNightTime}
          onTimeChange={(gftNightTime) => patch({ gftNightTime })}
          blockMinutes={blockMinutes}
        />
      </CategoryToggle>

      <CategoryToggle
        label="Multi Checks"
        enabled={value.multiChecksEnabled}
        onEnabledChange={(multiChecksEnabled) =>
          patch({
            multiChecksEnabled,
            multiDayEnabled: multiChecksEnabled ? value.multiDayEnabled : false,
            multiNightEnabled: multiChecksEnabled ? value.multiNightEnabled : false,
            multiIrtEnabled: multiChecksEnabled ? value.multiIrtEnabled : false,
          })
        }>
        <SubCategoryToggle
          label="Day"
          hint="1 Hr"
          enabled={value.multiDayEnabled}
          onEnabledChange={(multiDayEnabled) =>
            patch({ multiDayEnabled, multiDayTime: multiDayEnabled ? value.multiDayTime : '' })
          }
          time={value.multiDayTime}
          onTimeChange={(multiDayTime) => patch({ multiDayTime })}
          blockMinutes={blockMinutes}
        />
        <SubCategoryToggle
          label="Night"
          hint="1 Hr"
          enabled={value.multiNightEnabled}
          onEnabledChange={(multiNightEnabled) =>
            patch({ multiNightEnabled, multiNightTime: multiNightEnabled ? value.multiNightTime : '' })
          }
          time={value.multiNightTime}
          onTimeChange={(multiNightTime) => patch({ multiNightTime })}
          blockMinutes={blockMinutes}
        />
        <SubCategoryToggle
          label="IRT"
          hint="2 1/2 Hr"
          enabled={value.multiIrtEnabled}
          onEnabledChange={(multiIrtEnabled) =>
            patch({ multiIrtEnabled, multiIrtTime: multiIrtEnabled ? value.multiIrtTime : '' })
          }
          time={value.multiIrtTime}
          onTimeChange={(multiIrtTime) => patch({ multiIrtTime })}
          blockMinutes={blockMinutes}
        />
      </CategoryToggle>
    </View>
  );
}
