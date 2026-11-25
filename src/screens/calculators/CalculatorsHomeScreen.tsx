import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import type { CalculatorStackParamList } from './types';
import { CALCULATOR_ROUTE_HREFS } from './routes';
import { AppFontFamily } from '@/constants/fonts';
import { ARC } from '@/constants/Colors';
import { CalculatorColors, useCalculatorTheme } from './theme';

interface CalculatorCard {
  name: string;
  route: keyof CalculatorStackParamList;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  description: string;
}

const calculators: CalculatorCard[] = [
  { name: 'E6B Computer', route: 'EB6Calculator', icon: 'calculator', description: 'Time, speed, distance, fuel & wind' },
  { name: 'Navlog', route: 'NavlogCalculator', icon: 'map-o', description: 'Cross-country planning' },
  { name: 'Holding Pattern', route: 'HoldingPattern', icon: 'repeat', description: 'Entry sector & type' },
  { name: 'Weight & Balance', route: 'WeightBalance', icon: 'balance-scale', description: 'CG & limits' },
  { name: 'Wind Components', route: 'WindComponents', icon: 'flag', description: 'Head & crosswind' },
  { name: 'Pressure Altitude', route: 'PressureAltitude', icon: 'tachometer', description: 'PA from altimeter' },
  { name: 'Density Altitude', route: 'DensityAltitude', icon: 'cloud', description: 'DA & ISA deviation' },
  { name: 'Mach Speed', route: 'MachSpeed', icon: 'rocket', description: 'TAS ↔ Mach' },
  { name: 'True Airspeed', route: 'TrueAirSpeed', icon: 'fighter-jet', description: 'IAS to TAS' },
  { name: 'Indicated Airspeed', route: 'IndicatedAirSpeed', icon: 'plane', description: 'TAS to IAS' },
];

const CalculatorsHomeScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useCalculatorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <CalculatorSafeArea>
      <View style={styles.header}>
        <Text style={styles.heading}>Calculations</Text>
        <Text style={styles.subheading}>Aviation tools &amp; calculators</Text>
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
            <FontAwesome name={item.icon} size={18} color={ARC} style={styles.icon} />
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
      marginBottom: 10,
    },
    card: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 116,
    },
    icon: {
      marginBottom: 10,
    },
    name: {
      fontSize: 14,
      fontFamily: AppFontFamily.bold,
      color: colors.text,
      marginBottom: 3,
    },
    description: {
      fontSize: 11,
      fontFamily: AppFontFamily.regular,
      color: colors.muted,
      lineHeight: 15,
    },
  });
}

export default CalculatorsHomeScreen;
