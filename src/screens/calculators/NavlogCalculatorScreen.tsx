import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import type { NavlogLeg, NavlogLegResult } from './types';
import { fmt, parseNum, toRad, toDeg } from './utils';
import { colors, sharedStyles } from './theme';
import { StyleSheet } from 'react-native';

function newLeg(index: number): NavlogLeg {
  return {
    id: `${Date.now()}-${index}`,
    name: `Leg ${index}`,
    course: '',
    distance: '',
    tas: '',
    windDir: '',
    windSpeed: '',
    magVar: '',
    fuelFlow: '',
  };
}

function calculateLeg(leg: NavlogLeg): NavlogLegResult | null {
  const course = parseNum(leg.course);
  const distance = parseNum(leg.distance);
  const tasVal = parseNum(leg.tas);
  const wDir = parseNum(leg.windDir);
  const wSpd = parseNum(leg.windSpeed);
  const magVar = parseNum(leg.magVar);
  const fuelFlow = parseNum(leg.fuelFlow);

  if (distance <= 0 || tasVal <= 0) return null;

  const windAngle = toRad(wDir - course);
  const ratio = (wSpd * Math.sin(windAngle)) / tasVal;
  if (Math.abs(ratio) > 1) return null;

  const wcaRad = Math.asin(ratio);
  const trueHeading = (course + toDeg(wcaRad) + 360) % 360;
  const magHeading = (trueHeading + magVar + 360) % 360;
  const groundSpeed = tasVal * Math.cos(wcaRad) - wSpd * Math.cos(windAngle);
  if (groundSpeed <= 0) return null;

  const ete = (distance / groundSpeed) * 60;
  const fuelUsed = fuelFlow * (ete / 60);

  return { trueHeading, magHeading, groundSpeed, ete, fuelUsed };
}

const NavlogCalculatorScreen: React.FC = () => {
  const router = useRouter();
  const [legs, setLegs] = useState<NavlogLeg[]>([newLeg(1), newLeg(2)]);
  const [showResults, setShowResults] = useState<boolean>(false);

  const results = useMemo(() => legs.map((leg) => calculateLeg(leg)), [legs]);

  const totals = useMemo(() => {
    let distance = 0;
    let ete = 0;
    let fuel = 0;
    results.forEach((r, i) => {
      if (!r) return;
      distance += parseNum(legs[i].distance);
      ete += r.ete;
      fuel += r.fuelUsed;
    });
    return { distance, ete, fuel };
  }, [results, legs]);

  const updateLeg = (id: string, field: keyof NavlogLeg, value: string): void => {
    setLegs((prev) => prev.map((leg) => (leg.id === id ? { ...leg, [field]: value } : leg)));
  };

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Navlog Calculator</Text>
        </View>

        {legs.map((leg, index) => (
          <View key={leg.id} style={sharedStyles.card}>
            <View style={styles.legHeader}>
              <Text style={sharedStyles.sectionTitle}>{leg.name}</Text>
              {legs.length > 1 ? (
                <TouchableOpacity onPress={() => setLegs((prev) => prev.filter((l) => l.id !== leg.id))}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <CalcInput
              label="Name"
              value={leg.name}
              onChangeText={(v) => updateLeg(leg.id, 'name', v)}
              keyboardType="default"
            />
            <CalcInput label="Course" value={leg.course} onChangeText={(v) => updateLeg(leg.id, 'course', v)} unit="°" />
            <CalcInput label="Distance" value={leg.distance} onChangeText={(v) => updateLeg(leg.id, 'distance', v)} unit="nm" />
            <CalcInput label="TAS" value={leg.tas} onChangeText={(v) => updateLeg(leg.id, 'tas', v)} unit="kt" />
            <CalcInput label="Wind dir" value={leg.windDir} onChangeText={(v) => updateLeg(leg.id, 'windDir', v)} unit="°" />
            <CalcInput label="Wind speed" value={leg.windSpeed} onChangeText={(v) => updateLeg(leg.id, 'windSpeed', v)} unit="kt" />
            <CalcInput label="Mag var" value={leg.magVar} onChangeText={(v) => updateLeg(leg.id, 'magVar', v)} unit="°" />
            <CalcInput label="Fuel flow" value={leg.fuelFlow} onChangeText={(v) => updateLeg(leg.id, 'fuelFlow', v)} unit="GPH" />

            {showResults && results[index] ? (
              <View style={styles.results}>
                <CalcResult label="True Hdg" value={fmt(results[index]!.trueHeading, 0)} unit="°" />
                <CalcResult label="Mag Hdg" value={fmt(results[index]!.magHeading, 0)} unit="°" />
                <CalcResult label="GS" value={fmt(results[index]!.groundSpeed, 0)} unit="kt" />
                <CalcResult label="ETE" value={fmt(results[index]!.ete, 0)} unit="min" />
                <CalcResult label="Fuel" value={fmt(results[index]!.fuelUsed, 1)} unit="gal" />
              </View>
            ) : null}
          </View>
        ))}

        <TouchableOpacity style={styles.addLeg} onPress={() => setLegs((prev) => [...prev, newLeg(prev.length + 1)])}>
          <Text style={styles.addLegText}>+ Add leg</Text>
        </TouchableOpacity>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults ? (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.sectionTitle}>Totals</Text>
            <CalcResult label="Distance" value={fmt(totals.distance, 1)} unit="nm" />
            <CalcResult label="ETE" value={fmt(totals.ete, 0)} unit="min" highlight />
            <CalcResult label="Fuel" value={fmt(totals.fuel, 1)} unit="gal" />
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

const styles = StyleSheet.create({
  legHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remove: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  results: {
    marginTop: 8,
  },
  addLeg: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  addLegText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NavlogCalculatorScreen;
