import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import { fmt, parseNum, toRad } from './utils';
import { sharedStyles } from './theme';

const WindComponentsScreen: React.FC = () => {
  const router = useRouter();
  const [windDir, setWindDir] = useState<string>('');
  const [windSpeed, setWindSpeed] = useState<string>('');
  const [runwayHeading, setRunwayHeading] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const result = useMemo(() => {
    const wSpd = parseNum(windSpeed);
    const angle = toRad(parseNum(windDir) - parseNum(runwayHeading));
    const headwind = wSpd * Math.cos(angle);
    const crosswind = wSpd * Math.sin(angle);
    return { headwind, crosswind };
  }, [windDir, windSpeed, runwayHeading]);

  const headLabel = result.headwind >= 0 ? 'Headwind' : 'Tailwind';
  const crossLabel = result.crosswind >= 0 ? 'Crosswind (R)' : 'Crosswind (L)';

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Wind Components</Text>
        </View>

        <View style={sharedStyles.card}>
          <CalcInput label="Wind direction" value={windDir} onChangeText={setWindDir} unit="°" />
          <CalcInput label="Wind speed" value={windSpeed} onChangeText={setWindSpeed} unit="kt" />
          <CalcInput label="Runway heading" value={runwayHeading} onChangeText={setRunwayHeading} unit="°" />
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults ? (
          <View style={sharedStyles.card}>
            <CalcResult label={headLabel} value={fmt(Math.abs(result.headwind), 1)} unit="kt" highlight />
            <CalcResult label={crossLabel} value={fmt(Math.abs(result.crosswind), 1)} unit="kt" />
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default WindComponentsScreen;
