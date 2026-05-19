import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import type { EB6Mode, TsdSolve } from './types';
import { fmt, parseNum, toDeg, toRad } from './utils';
import { colors, sharedStyles } from './theme';

const EB6CalculatorScreen: React.FC = () => {
  const router = useRouter();
  const [mode, setMode] = useState<EB6Mode>('TSD');
  const [solve, setSolve] = useState<TsdSolve>('time');
  const [speed, setSpeed] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [fuelFlow, setFuelFlow] = useState<string>('');
  const [fuelTime, setFuelTime] = useState<string>('');
  const [fuelUsed, setFuelUsed] = useState<string>('');
  const [tas, setTas] = useState<string>('');
  const [windDir, setWindDir] = useState<string>('');
  const [windSpeed, setWindSpeed] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const tsdResult = useMemo((): { value: number; label: string; unit: string } | null => {
    const s = parseNum(speed);
    const d = parseNum(distance);
    const t = parseNum(time);
    if (solve === 'time' && s > 0 && d > 0) {
      return { value: (d / s) * 60, label: 'Time', unit: 'min' };
    }
    if (solve === 'distance' && s > 0 && t > 0) {
      return { value: s * (t / 60), label: 'Distance', unit: 'nm' };
    }
    if (solve === 'speed' && d > 0 && t > 0) {
      return { value: d / (t / 60), label: 'Speed', unit: 'kt' };
    }
    return null;
  }, [solve, speed, distance, time]);

  const fuelResult = useMemo((): number | null => {
    const flow = parseNum(fuelFlow);
    const t = parseNum(fuelTime);
    const used = parseNum(fuelUsed);
    if (flow > 0 && t > 0) return flow * (t / 60);
    if (flow > 0 && used > 0) return (used / flow) * 60;
    return null;
  }, [fuelFlow, fuelTime, fuelUsed]);

  const windResult = useMemo(() => {
    const tasVal = parseNum(tas);
    const wDir = parseNum(windDir);
    const wSpd = parseNum(windSpeed);
    const crs = parseNum(course);
    if (tasVal <= 0 || wSpd <= 0) return null;
    const ratio = (wSpd * Math.sin(toRad(wDir - crs))) / tasVal;
    if (Math.abs(ratio) > 1) return null;
    const wca = toDeg(Math.asin(ratio));
    const heading = (crs + wca + 360) % 360;
    const windAngle = toRad(wDir - crs);
    const groundSpeed = tasVal * Math.cos(toRad(wca)) - wSpd * Math.cos(windAngle);
    return { wca, heading, groundSpeed };
  }, [tas, windDir, windSpeed, course]);

  const handleCalculate = (): void => {
    setShowResults(true);
  };

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>E6B Calculator</Text>
        </View>

        <View style={sharedStyles.segmentRow}>
          {(['TSD', 'Fuel', 'Wind'] as EB6Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[sharedStyles.segment, mode === m ? sharedStyles.segmentActive : null]}
              onPress={() => {
                setMode(m);
                setShowResults(false);
              }}>
              <Text style={[sharedStyles.segmentText, mode === m ? sharedStyles.segmentTextActive : null]}>
                {m === 'TSD' ? 'T-S-D' : m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'TSD' ? (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.sectionTitle}>Time · Speed · Distance</Text>
            <View style={sharedStyles.segmentRow}>
              {(['time', 'speed', 'distance'] as TsdSolve[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[sharedStyles.segment, solve === s ? sharedStyles.segmentActive : null]}
                  onPress={() => setSolve(s)}>
                  <Text style={[sharedStyles.segmentText, solve === s ? sharedStyles.segmentTextActive : null]}>
                    Solve {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {solve !== 'time' ? (
              <CalcInput label="Time" value={time} onChangeText={setTime} unit="min" />
            ) : null}
            {solve !== 'speed' ? (
              <CalcInput label="Speed" value={speed} onChangeText={setSpeed} unit="kt" />
            ) : null}
            {solve !== 'distance' ? (
              <CalcInput label="Distance" value={distance} onChangeText={setDistance} unit="nm" />
            ) : null}
          </View>
        ) : null}

        {mode === 'Fuel' ? (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.sectionTitle}>Fuel</Text>
            <CalcInput label="Fuel Flow" value={fuelFlow} onChangeText={setFuelFlow} unit="GPH" />
            <CalcInput label="Time" value={fuelTime} onChangeText={setFuelTime} unit="min" />
            <CalcInput label="Fuel Used (optional)" value={fuelUsed} onChangeText={setFuelUsed} unit="gal" />
          </View>
        ) : null}

        {mode === 'Wind' ? (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.sectionTitle}>Wind correction</Text>
            <CalcInput label="TAS" value={tas} onChangeText={setTas} unit="kt" />
            <CalcInput label="Wind direction" value={windDir} onChangeText={setWindDir} unit="°" />
            <CalcInput label="Wind speed" value={windSpeed} onChangeText={setWindSpeed} unit="kt" />
            <CalcInput label="Course" value={course} onChangeText={setCourse} unit="°" />
          </View>
        ) : null}

        <CalcButton onPress={handleCalculate} />

        {showResults && mode === 'TSD' && tsdResult ? (
          <View style={sharedStyles.card}>
            <CalcResult label={tsdResult.label} value={fmt(tsdResult.value, 2)} unit={tsdResult.unit} highlight />
          </View>
        ) : null}

        {showResults && mode === 'Fuel' && fuelResult !== null ? (
          <View style={sharedStyles.card}>
            <CalcResult label="Fuel used" value={fmt(fuelResult, 2)} unit="gal" highlight />
          </View>
        ) : null}

        {showResults && mode === 'Wind' && windResult ? (
          <View style={sharedStyles.card}>
            <CalcResult label="WCA" value={fmt(windResult.wca, 1)} unit="°" />
            <CalcResult label="Heading" value={fmt(windResult.heading, 0)} unit="°" highlight />
            <CalcResult label="Ground speed" value={fmt(windResult.groundSpeed, 0)} unit="kt" />
          </View>
        ) : null}

        {showResults && mode === 'Wind' && !windResult ? (
          <Text style={styles.errorText}>Check inputs (TAS must exceed crosswind component).</Text>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

const styles = StyleSheet.create({
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EB6CalculatorScreen;
