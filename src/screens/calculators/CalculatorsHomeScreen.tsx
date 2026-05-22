import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import type { CalculatorStackParamList } from './types';
import { CALCULATOR_ROUTE_HREFS } from './routes';
import { AppFontFamily } from '@/constants/fonts';
import { CalculatorColors, useCalculatorTheme } from './theme';

interface CalculatorCard {
  name: string;
  route: keyof CalculatorStackParamList;
  icon: string;
  description: string;
}

const calculators: CalculatorCard[] = [
  { name: 'Calculator', route: 'EB6Calculator', icon: '✈️', description: 'TSD, Fuel & Wind' },
  { name: 'Navlog', route: 'NavlogCalculator', icon: '🗺️', description: 'Cross-country planning' },
  { name: 'Holding Pattern', route: 'HoldingPattern', icon: '🔄', description: 'Entry sector & type' },
  { name: 'Weight & Balance', route: 'WeightBalance', icon: '⚖️', description: 'CG & limits' },
  { name: 'Wind Components', route: 'WindComponents', icon: '💨', description: 'Head/crosswind' },
  { name: 'Pressure Altitude', route: 'PressureAltitude', icon: '📊', description: 'PA from altimeter' },
  { name: 'Density Altitude', route: 'DensityAltitude', icon: '☁️', description: 'DA & ISA deviation' },
  { name: 'Mach Speed', route: 'MachSpeed', icon: '🚀', description: 'TAS ↔ Mach' },
  { name: 'True Airspeed', route: 'TrueAirSpeed', icon: '🛫', description: 'IAS to TAS' },
  { name: 'Indicated Airspeed', route: 'IndicatedAirSpeed', icon: '📟', description: 'TAS to IAS' },
];

const CalculatorsHomeScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useCalculatorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <CalculatorSafeArea>
      <View style={styles.header}>
        <Text style={styles.heading}>Calculations</Text>
        <Text style={styles.subheading}>Aviation tools & calculators</Text>
      </View>
      <FlatList
        data={calculators}
        keyExtractor={(item) => item.route}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(CALCULATOR_ROUTE_HREFS[item.route])}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </CalculatorSafeArea>
  );
};

function createStyles(colors: CalculatorColors) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    heading: {
      fontSize: 24,
      fontFamily: AppFontFamily.bold,
      color: colors.text,
    },
    subheading: {
      fontSize: 14,
      fontFamily: AppFontFamily.regular,
      color: colors.muted,
      marginTop: 4,
    },
    list: {
      paddingHorizontal: 12,
      paddingBottom: 24,
    },
    row: {
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    card: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 120,
    },
    icon: {
      fontSize: 28,
      marginBottom: 8,
    },
    name: {
      fontSize: 14,
      fontFamily: AppFontFamily.bold,
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 11,
      fontFamily: AppFontFamily.regular,
      color: colors.muted,
      lineHeight: 16,
    },
  });
}

export default CalculatorsHomeScreen;
