import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import type { EntryType, HoldSide } from './types';
import { parseNum } from './utils';
import { useCalculatorTheme } from './theme';

function determineEntry(angle: number, holdSide: HoldSide): EntryType {
  if (holdSide === 'Right') {
    if (angle <= 70 || angle >= 310) return 'Direct';
    if (angle > 70 && angle <= 130) return 'Teardrop';
    return 'Parallel';
  }
  if (angle >= 230 && angle <= 290) return 'Direct';
  if (angle > 170 && angle < 230) return 'Teardrop';
  return 'Parallel';
}

const ENTRY_DESCRIPTIONS: Record<EntryType, string> = {
  Direct: 'Turn to the outbound heading and enter the hold directly on the protected side.',
  Teardrop: 'Turn 30° toward the holding side, fly for one minute, then turn inbound to intercept.',
  Parallel: 'Turn to parallel the outbound leg on the non-holding side, then turn inbound when abeam.',
};

const HoldingPatternScreen: React.FC = () => {
  const router = useRouter();
  const { styles: sharedStyles } = useCalculatorTheme();
  const [inboundCourse, setInboundCourse] = useState<string>('');
  const [aircraftHeading, setAircraftHeading] = useState<string>('');
  const [holdSide, setHoldSide] = useState<HoldSide>('Right');
  const [showResults, setShowResults] = useState<boolean>(false);

  const entryType = useMemo((): EntryType | null => {
    const inbound = parseNum(inboundCourse);
    const heading = parseNum(aircraftHeading);
    if (!inboundCourse.trim() || !aircraftHeading.trim()) return null;
    const angle = ((heading - inbound) + 360) % 360;
    return determineEntry(angle, holdSide);
  }, [inboundCourse, aircraftHeading, holdSide]);

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Holding Pattern</Text>
        </View>

        <View style={sharedStyles.card}>
          <CalcInput label="Inbound course" value={inboundCourse} onChangeText={setInboundCourse} unit="°" />
          <CalcInput label="Aircraft heading" value={aircraftHeading} onChangeText={setAircraftHeading} unit="°" />
          <Text style={sharedStyles.sectionTitle}>Hold side</Text>
          <View style={sharedStyles.segmentRow}>
            {(['Right', 'Left'] as HoldSide[]).map((side) => (
              <TouchableOpacity
                key={side}
                style={[sharedStyles.segment, holdSide === side ? sharedStyles.segmentActive : null]}
                onPress={() => setHoldSide(side)}>
                <Text style={[sharedStyles.segmentText, holdSide === side ? sharedStyles.segmentTextActive : null]}>
                  {side}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults && entryType ? (
          <View style={sharedStyles.card}>
            <CalcResult label="Recommended entry" value={entryType} highlight />
            <Text style={sharedStyles.description}>{ENTRY_DESCRIPTIONS[entryType]}</Text>
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default HoldingPatternScreen;
