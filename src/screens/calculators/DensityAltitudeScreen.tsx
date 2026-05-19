import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import { fmt, parseNum } from './utils';
import { sharedStyles } from './theme';

const DensityAltitudeScreen: React.FC = () => {
  const router = useRouter();
  const [pressureAlt, setPressureAlt] = useState<string>('');
  const [oat, setOat] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const result = useMemo(() => {
    const pa = parseNum(pressureAlt);
    const oatVal = parseNum(oat);
    const isaTemp = 15 - (pa / 1000) * 1.98;
    const da = pa + 118.8 * (oatVal - isaTemp);
    const deviation = oatVal - isaTemp;
    return { da, isaTemp, deviation };
  }, [pressureAlt, oat]);

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Density Altitude</Text>
        </View>

        <View style={sharedStyles.card}>
          <CalcInput label="Pressure altitude" value={pressureAlt} onChangeText={setPressureAlt} unit="ft" />
          <CalcInput label="OAT" value={oat} onChangeText={setOat} unit="°C" />
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults ? (
          <View style={sharedStyles.card}>
            <CalcResult label="Density altitude" value={fmt(result.da, 0)} unit="ft" highlight />
            <CalcResult label="ISA temp at PA" value={fmt(result.isaTemp, 1)} unit="°C" />
            <CalcResult
              label="ISA deviation"
              value={`${result.deviation >= 0 ? '+' : ''}${fmt(result.deviation, 1)}`}
              unit="°C"
            />
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default DensityAltitudeScreen;
