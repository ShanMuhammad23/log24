import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import { fmt, parseNum } from './utils';
import { sharedStyles } from './theme';

const TrueAirSpeedScreen: React.FC = () => {
  const router = useRouter();
  const [ias, setIas] = useState<string>('');
  const [pressureAlt, setPressureAlt] = useState<string>('');
  const [oat, setOat] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const result = useMemo(() => {
    const iasVal = parseNum(ias);
    const pa = parseNum(pressureAlt);
    const oatVal = parseNum(oat);
    const oatK = oatVal + 273.15;
    const densityRatio = (288.15 / oatK) * Math.pow(1 - 0.0000226 * pa, 5.256);
    if (densityRatio <= 0) return null;
    const tas = iasVal / Math.sqrt(densityRatio);
    const percentIncrease = iasVal > 0 ? ((tas - iasVal) / iasVal) * 100 : 0;
    return { tas, percentIncrease };
  }, [ias, pressureAlt, oat]);

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>True Air Speed</Text>
        </View>

        <View style={sharedStyles.card}>
          <CalcInput label="IAS" value={ias} onChangeText={setIas} unit="kt" />
          <CalcInput label="Pressure altitude" value={pressureAlt} onChangeText={setPressureAlt} unit="ft" />
          <CalcInput label="OAT" value={oat} onChangeText={setOat} unit="°C" />
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults && result ? (
          <View style={sharedStyles.card}>
            <CalcResult label="TAS" value={fmt(result.tas, 0)} unit="kt" highlight />
            <CalcResult label="Increase over IAS" value={fmt(result.percentIncrease, 1)} unit="%" />
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default TrueAirSpeedScreen;
