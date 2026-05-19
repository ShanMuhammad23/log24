import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import type { MachMode } from './types';
import { fmt, parseNum } from './utils';
import { sharedStyles } from './theme';

const MachSpeedScreen: React.FC = () => {
  const router = useRouter();
  const [mode, setMode] = useState<MachMode>('TAStoMach');
  const [altitude, setAltitude] = useState<string>('');
  const [tas, setTas] = useState<string>('');
  const [mach, setMach] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const result = useMemo(() => {
    const alt = parseNum(altitude);
    const isaTempK = 288.15 - 0.00198 * alt;
    const speedOfSound = 661.47 * Math.sqrt(isaTempK / 288.15);
    const isaOatC = isaTempK - 273.15;

    if (mode === 'TAStoMach') {
      const tasVal = parseNum(tas);
      const machVal = speedOfSound > 0 ? tasVal / speedOfSound : 0;
      return { primary: machVal, primaryLabel: 'Mach', speedOfSound, isaOatC };
    }

    const machVal = parseNum(mach);
    const tasVal = machVal * speedOfSound;
    return { primary: tasVal, primaryLabel: 'TAS', speedOfSound, isaOatC };
  }, [mode, altitude, tas, mach]);

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Mach Speed</Text>
        </View>

        <View style={sharedStyles.segmentRow}>
          {(['TAStoMach', 'MachToTAS'] as MachMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[sharedStyles.segment, mode === m ? sharedStyles.segmentActive : null]}
              onPress={() => setMode(m)}>
              <Text style={[sharedStyles.segmentText, mode === m ? sharedStyles.segmentTextActive : null]}>
                {m === 'TAStoMach' ? 'TAS → Mach' : 'Mach → TAS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={sharedStyles.card}>
          <CalcInput label="Altitude" value={altitude} onChangeText={setAltitude} unit="ft" />
          {mode === 'TAStoMach' ? (
            <CalcInput label="TAS" value={tas} onChangeText={setTas} unit="kt" />
          ) : (
            <CalcInput label="Mach" value={mach} onChangeText={setMach} />
          )}
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults ? (
          <View style={sharedStyles.card}>
            <CalcResult label={result.primaryLabel} value={fmt(result.primary, 3)} highlight />
            <CalcResult label="Speed of sound" value={fmt(result.speedOfSound, 0)} unit="kt" />
            <CalcResult label="ISA OAT" value={fmt(result.isaOatC, 1)} unit="°C" />
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default MachSpeedScreen;
