import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import HoldingPatternDiagram from './components/HoldingPatternDiagram';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import {
  calculateHoldingPattern,
  ENTRY_DESCRIPTIONS,
  formatHeading,
  parseHeadingInput,
} from './holdingPatternCalculations';
import type { HoldCourseMode, HoldSide } from './types';
import { parseNum } from './utils';
import { type CalculatorColors, useCalculatorTheme } from './theme';

const HoldingPatternScreen: React.FC = () => {
  const router = useRouter();
  const { styles: sharedStyles, colors } = useCalculatorTheme();

  const [aircraftHeading, setAircraftHeading] = useState('30');
  const [holdCourse, setHoldCourse] = useState('90');
  const [holdCourseMode, setHoldCourseMode] = useState<HoldCourseMode>('Outbound');
  const [holdSide, setHoldSide] = useState<HoldSide>('Right');
  const [aircraftSpeed, setAircraftSpeed] = useState('120');
  const [windSpeed, setWindSpeed] = useState('10');
  const [windDirection, setWindDirection] = useState('30');
  const [northUp, setNorthUp] = useState(true);
  const [showEntryPath, setShowEntryPath] = useState(true);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const result = useMemo(() => {
    const heading = parseHeadingInput(aircraftHeading);
    const course = parseHeadingInput(holdCourse);
    const tas = parseNum(aircraftSpeed);
    const wSpd = parseNum(windSpeed);
    const wDir = parseHeadingInput(windDirection) ?? parseNum(windDirection);

    if (heading === null || course === null || tas <= 0) return null;
    return calculateHoldingPattern(heading, course, holdCourseMode, holdSide, tas, wDir, wSpd);
  }, [aircraftHeading, holdCourse, holdCourseMode, holdSide, aircraftSpeed, windSpeed, windDirection]);

  const showInstructions = () => {
    if (!result) {
      Alert.alert('Instructions', 'Enter valid headings and airspeed to see entry instructions.');
      return;
    }
    Alert.alert(`${result.entryType} Entry`, ENTRY_DESCRIPTIONS[result.entryType]);
  };

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Holding Pattern</Text>
        </View>

        <View style={styles.readoutCard}>
          <View style={styles.readoutRow}>
            <Text style={styles.readoutGroupLabel}>Course</Text>
            <View style={styles.readoutPair}>
              <ReadoutCell label="In" value={result ? formatHeading(result.inboundCourse) : '—'} colors={colors} />
              <ReadoutCell label="Out" value={result ? formatHeading(result.outboundCourse) : '—'} colors={colors} />
            </View>
          </View>
          <View style={styles.readoutDivider} />
          <View style={styles.readoutRow}>
            <Text style={styles.readoutGroupLabel}>Heading</Text>
            <View style={styles.readoutPair}>
              <ReadoutCell label="In" value={result ? formatHeading(result.inboundHeading) : '—'} colors={colors} highlight />
              <ReadoutCell label="Out" value={result ? formatHeading(result.outboundHeading) : '—'} colors={colors} highlight />
            </View>
          </View>
          {result ? (
            <View style={styles.entryBadge}>
              <Text style={styles.entryBadgeLabel}>Recommended entry</Text>
              <Text style={styles.entryBadgeValue}>{result.entryType}</Text>
            </View>
          ) : null}
        </View>

        {result ? (
          <HoldingPatternDiagram
            result={result}
            aircraftHeading={parseHeadingInput(aircraftHeading) ?? 0}
            holdSide={holdSide}
            northUp={northUp}
            showEntryPath={showEntryPath}
            colors={colors}
            onToggleNorthUp={() => setNorthUp((v) => !v)}
            onToggleEntryPath={() => setShowEntryPath((v) => !v)}
            onShowInstructions={showInstructions}
          />
        ) : (
          <View style={[styles.placeholderCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.placeholderText, { color: colors.muted }]}>
              Enter aircraft heading, hold course, and airspeed for wind-corrected headings and entry sector.
            </Text>
          </View>
        )}

        <View style={[styles.formCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <FormField label="Aircraft Heading" value={aircraftHeading} onChangeText={setAircraftHeading} colors={colors} />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Hold</Text>
          <View style={styles.holdRow}>
            <SegmentToggle
              options={['Inbound', 'Outbound'] as HoldCourseMode[]}
              value={holdCourseMode}
              onChange={setHoldCourseMode}
              colors={colors}
            />
            <View style={styles.holdCourseInput}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={holdCourse}
                onChangeText={setHoldCourse}
                keyboardType="numeric"
                placeholder="°"
                placeholderTextColor={colors.muted}
              />
              <Text style={[styles.unit, { color: colors.muted }]}>°</Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Hold Turns</Text>
          <SegmentToggle
            options={['Left', 'Right'] as HoldSide[]}
            value={holdSide}
            onChange={setHoldSide}
            colors={colors}
          />

          <Text style={[styles.sectionLabel, { color: colors.text }]}>Wind Correction</Text>
          <FormField label="Aircraft Speed" value={aircraftSpeed} onChangeText={setAircraftSpeed} unit="kt" colors={colors} />
          <FormField label="Wind Speed" value={windSpeed} onChangeText={setWindSpeed} unit="kt" colors={colors} />
          <FormField label="Wind Direction" value={windDirection} onChangeText={setWindDirection} unit="°" colors={colors} />
        </View>
      </ScrollView>
    </CalculatorSafeArea>
  );
};

function ReadoutCell({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: CalculatorColors;
  highlight?: boolean;
}) {
  return (
    <View style={readoutStyles.cell}>
      <Text style={[readoutStyles.cellLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[readoutStyles.cellValue, { color: highlight ? colors.accent : colors.text }]}>{value}</Text>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  unit,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit?: string;
  colors: CalculatorColors;
}) {
  return (
    <View style={formStyles.wrap}>
      <Text style={[formStyles.label, { color: colors.muted }]}>{label}</Text>
      <View style={formStyles.row}>
        <TextInput
          style={[formStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={colors.muted}
        />
        {unit ? <Text style={[formStyles.unit, { color: colors.muted }]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function SegmentToggle<T extends string>({
  options,
  value,
  onChange,
  colors,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  colors: CalculatorColors;
}) {
  return (
    <View style={segmentStyles.row}>
      {options.map((option) => {
        const active = value === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              segmentStyles.btn,
              { borderColor: colors.border, backgroundColor: active ? colors.accent : colors.bg },
            ]}
            onPress={() => onChange(option)}>
            <Text style={[segmentStyles.text, { color: active ? colors.onAccent : colors.text }]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const readoutStyles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  cellLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

const formStyles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
  },
});

const segmentStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

function createStyles(colors: CalculatorColors) {
  return StyleSheet.create({
    readoutCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    readoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    readoutGroupLabel: {
      width: 64,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    readoutPair: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
    },
    readoutDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 14,
    },
    entryBadge: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    entryBadgeLabel: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: '500',
    },
    entryBadgeValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.accent,
    },
    placeholderCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 24,
      marginBottom: 12,
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    formCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 6,
    },
    sectionLabel: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 4,
      marginBottom: 12,
    },
    holdRow: {
      gap: 10,
      marginBottom: 4,
    },
    holdCourseInput: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    unit: {
      fontSize: 14,
      fontWeight: '600',
    },
  });
}

export default HoldingPatternScreen;
