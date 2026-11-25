import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import { fmt, parseNum } from './utils';
import { useCalculatorTheme } from './theme';

const IndicatedAirSpeedScreen: React.FC = () => {
  const router = useRouter();
  const { styles: sharedStyles } = useCalculatorTheme();
  const [tas, setTas] = useState<string>('');
  const [pressureAlt, setPressureAlt] = useState<string>('');
  const [oat, setOat] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const ias = useMemo((): number => {
    const tasVal = parseNum(tas);
    const pa = parseNum(pressureAlt);
    const oatK = parseNum(oat) + 273.15;
    const densityRatio = (288.15 / oatK) * Math.pow(1 - 0.0000226 * pa, 5.256);
    if (densityRatio <= 0) return NaN;
    return tasVal * Math.sqrt(densityRatio);
  }, [tas, pressureAlt, oat]);

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Indicated Air Speed</Text>
        </View>

        <View style={sharedStyles.card}>
          <CalcInput label="TAS" value={tas} onChangeText={setTas} unit="kt" />
          <CalcInput label="Pressure altitude" value={pressureAlt} onChangeText={setPressureAlt} unit="ft" />
          <CalcInput label="OAT" value={oat} onChangeText={setOat} unit="°C" />
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults ? (
          <View style={sharedStyles.card}>
            <CalcResult label="IAS" value={fmt(ias, 0)} unit="kt" highlight />
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default IndicatedAirSpeedScreen;
