import { Pressable, Text, TextInput, View } from 'react-native';
import { CollapsibleCategoryRow } from '@/components/flight-form/CollapsibleCategoryRow';
import { formatDuration, toMinutes } from '@/utils/flight-form';
import { countPicBreakdownSelections, type PicBreakdownFormState, type PicCctsPeriod } from '@/utils/pic-breakdown';

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
  const selectionCount = countPicBreakdownSelections(value);
  const showTimeInputs = selectionCount >= 2;

  const setCctsPeriod = (period: PicCctsPeriod) => {
    patch({ cctsPeriod: period });
  };

  const blockTimeHint =
    selectionCount === 1 && blockMinutes !== null && blockMinutes > 0 ? (
      <Text className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Block time ({formatDuration(blockMinutes)}) will apply to the selected category.
      </Text>
    ) : null;

  return (
    <View>
      {blockTimeHint}
      <CollapsibleCategoryRow
        label="CCTS (30 Hr)"
        expanded={value.cctsEnabled}
        onExpandedChange={(enabled) =>
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
          showTimeInputs ? (
            <TimeInput value={value.cctsTime} onChangeText={(cctsTime) => patch({ cctsTime })} blockMinutes={blockMinutes} />
          ) : null
        ) : (
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">Select Day or Night.</Text>
        )}
      </CollapsibleCategoryRow>

      <CollapsibleCategoryRow
        label="XCTY (50 Hr)"
        expanded={value.xctyEnabled}
        onExpandedChange={(xctyEnabled) =>
          patch({ xctyEnabled, xctyTime: xctyEnabled ? value.xctyTime : '' })
        }>
        {showTimeInputs ? (
          <TimeInput value={value.xctyTime} onChangeText={(xctyTime) => patch({ xctyTime })} blockMinutes={blockMinutes} />
        ) : null}
      </CollapsibleCategoryRow>

      <CollapsibleCategoryRow
        label="Night"
        expanded={value.nightCategoryEnabled}
        onExpandedChange={(nightCategoryEnabled) =>
          patch({
            nightCategoryEnabled,
            nightCategoryTime: nightCategoryEnabled ? value.nightCategoryTime : '',
          })
        }>
        {showTimeInputs ? (
          <TimeInput
            value={value.nightCategoryTime}
            onChangeText={(nightCategoryTime) => patch({ nightCategoryTime })}
            blockMinutes={blockMinutes}
          />
        ) : null}
      </CollapsibleCategoryRow>

      <CollapsibleCategoryRow
        label="GFT Checks (8 Hr)"
        expanded={value.gftChecksEnabled}
        onExpandedChange={(gftChecksEnabled) =>
          patch({
            gftChecksEnabled,
            gft300nmEnabled: gftChecksEnabled ? value.gft300nmEnabled : false,
            gft250nmEnabled: gftChecksEnabled ? value.gft250nmEnabled : false,
            gft120nmEnabled: gftChecksEnabled ? value.gft120nmEnabled : false,
            gftDayEnabled: gftChecksEnabled ? value.gftDayEnabled : false,
            gftNightEnabled: gftChecksEnabled ? value.gftNightEnabled : false,
          })
        }>
        <CollapsibleCategoryRow
          label="300 NM (GFT)"
          hint="4–5 Hr — counts toward cross country"
          nested
          expanded={value.gft300nmEnabled}
          onExpandedChange={(gft300nmEnabled) =>
            patch({ gft300nmEnabled, gft300nmTime: gft300nmEnabled ? value.gft300nmTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.gft300nmTime}
              onChangeText={(gft300nmTime) => patch({ gft300nmTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
        <CollapsibleCategoryRow
          label="250 NM"
          hint="3 1/2 Hr"
          nested
          expanded={value.gft250nmEnabled}
          onExpandedChange={(gft250nmEnabled) =>
            patch({ gft250nmEnabled, gft250nmTime: gft250nmEnabled ? value.gft250nmTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.gft250nmTime}
              onChangeText={(gft250nmTime) => patch({ gft250nmTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
        <CollapsibleCategoryRow
          label="120 NM"
          hint="2 1/2 Hr"
          nested
          expanded={value.gft120nmEnabled}
          onExpandedChange={(gft120nmEnabled) =>
            patch({ gft120nmEnabled, gft120nmTime: gft120nmEnabled ? value.gft120nmTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.gft120nmTime}
              onChangeText={(gft120nmTime) => patch({ gft120nmTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
        <CollapsibleCategoryRow
          label="Day"
          nested
          expanded={value.gftDayEnabled}
          onExpandedChange={(gftDayEnabled) =>
            patch({ gftDayEnabled, gftDayTime: gftDayEnabled ? value.gftDayTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.gftDayTime}
              onChangeText={(gftDayTime) => patch({ gftDayTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
        <CollapsibleCategoryRow
          label="Night"
          nested
          expanded={value.gftNightEnabled}
          onExpandedChange={(gftNightEnabled) =>
            patch({ gftNightEnabled, gftNightTime: gftNightEnabled ? value.gftNightTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.gftNightTime}
              onChangeText={(gftNightTime) => patch({ gftNightTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
      </CollapsibleCategoryRow>

      <CollapsibleCategoryRow
        label="Multi Checks"
        expanded={value.multiChecksEnabled}
        onExpandedChange={(multiChecksEnabled) =>
          patch({
            multiChecksEnabled,
            multiDayEnabled: multiChecksEnabled ? value.multiDayEnabled : false,
            multiNightEnabled: multiChecksEnabled ? value.multiNightEnabled : false,
            multiIrtEnabled: multiChecksEnabled ? value.multiIrtEnabled : false,
          })
        }>
        <CollapsibleCategoryRow
          label="Day"
          hint="1 Hr"
          nested
          expanded={value.multiDayEnabled}
          onExpandedChange={(multiDayEnabled) =>
            patch({ multiDayEnabled, multiDayTime: multiDayEnabled ? value.multiDayTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.multiDayTime}
              onChangeText={(multiDayTime) => patch({ multiDayTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
        <CollapsibleCategoryRow
          label="Night"
          hint="1 Hr"
          nested
          expanded={value.multiNightEnabled}
          onExpandedChange={(multiNightEnabled) =>
            patch({ multiNightEnabled, multiNightTime: multiNightEnabled ? value.multiNightTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.multiNightTime}
              onChangeText={(multiNightTime) => patch({ multiNightTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
        <CollapsibleCategoryRow
          label="IRT"
          hint="2 1/2 Hr"
          nested
          expanded={value.multiIrtEnabled}
          onExpandedChange={(multiIrtEnabled) =>
            patch({ multiIrtEnabled, multiIrtTime: multiIrtEnabled ? value.multiIrtTime : '' })
          }>
          {showTimeInputs ? (
            <TimeInput
              value={value.multiIrtTime}
              onChangeText={(multiIrtTime) => patch({ multiIrtTime })}
              blockMinutes={blockMinutes}
            />
          ) : null}
        </CollapsibleCategoryRow>
      </CollapsibleCategoryRow>
    </View>
  );
}
