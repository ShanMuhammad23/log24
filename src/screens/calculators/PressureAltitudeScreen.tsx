import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import { fmt, parseNum } from './utils';
import { useCalculatorTheme } from './theme';

const PressureAltitudeScreen: React.FC = () => {
  const router = useRouter();
  const { styles: sharedStyles } = useCalculatorTheme();
  const [elevation, setElevation] = useState<string>('');
  const [altimeter, setAltimeter] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const pressureAltitude = useMemo((): number => {
    return parseNum(elevation) + (29.92 - parseNum(altimeter)) * 1000;
  }, [elevation, altimeter]);

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Pressure Altitude</Text>
        </View>

        <View style={sharedStyles.card}>
          <CalcInput label="Field elevation" value={elevation} onChangeText={setElevation} unit="ft" />
          <CalcInput label="Altimeter setting" value={altimeter} onChangeText={setAltimeter} unit="inHg" />
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults ? (
          <View style={sharedStyles.card}>
            <CalcResult label="Pressure altitude" value={fmt(pressureAltitude, 0)} unit="ft" highlight />
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default PressureAltitudeScreen;
