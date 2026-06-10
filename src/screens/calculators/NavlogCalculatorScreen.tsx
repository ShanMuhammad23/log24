import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import { calculateNavlogLeg, formatNavlogNumber } from './navlogCalculations';
import type { NavlogLeg, NavlogLegResult, NavlogSettings } from './types';
import { parseNum } from './utils';
import { type CalculatorColors, useCalculatorTheme } from './theme';

const STORAGE_KEY = 'navlog-calculator-v1';
const DEFAULT_ROW_COUNT = 5;

type ColumnDef = {
  key: string;
  label: string;
  width: number;
  editable?: boolean;
  textInput?: boolean;
  decimals?: number;
};

const COLUMNS: ColumnDef[] = [
  { key: 'trueCourse', label: 'True\nCourse', width: 58, editable: true },
  { key: 'altitude', label: 'Alt.', width: 52, editable: true },
  { key: 'tas', label: 'True\nAir Spd', width: 58, editable: true },
  { key: 'windDir', label: 'True Wind\nDir', width: 62, editable: true },
  { key: 'windSpeed', label: 'Wind\nSpd', width: 52, editable: true },
  { key: 'wca', label: 'Wind Corr.\nAng.', width: 58, decimals: 0 },
  { key: 'trueHeading', label: 'True\nHdg', width: 52, decimals: 0 },
  { key: 'magVar', label: 'Mag\nVar', width: 52, editable: true },
  { key: 'magHeading', label: 'Mag\nHdg', width: 52, decimals: 0 },
  { key: 'magDev', label: 'Mag\nDev', width: 52, editable: true },
  { key: 'compassHeading', label: 'Comps\nHdg', width: 58, decimals: 0 },
  { key: 'checkpoint', label: 'Check Point\nName', width: 110, editable: true, textInput: true },
  { key: 'distance', label: 'Dist', width: 52, editable: true, decimals: 2 },
  { key: 'groundSpeed', label: 'Grnd\nSpd', width: 52, decimals: 0 },
  { key: 'timeHours', label: 'Time', width: 52, decimals: 1 },
  { key: 'fuelUsed', label: 'Fuel', width: 52, decimals: 1 },
];

const DEFAULT_SETTINGS: NavlogSettings = {
  calculateTasFromIas: false,
  fuelBurnGph: '',
  oat: '',
};

function newLeg(index: number): NavlogLeg {
  return {
    id: `${Date.now()}-${index}`,
    checkpoint: '',
    trueCourse: '',
    altitude: '',
    tas: '',
    windDir: '',
    windSpeed: '',
    magVar: '',
    magDev: '',
    distance: '',
  };
}

function createDefaultLegs(): NavlogLeg[] {
  return Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => newLeg(i + 1));
}

const NavlogCalculatorScreen: React.FC = () => {
  const router = useRouter();
  const { styles: sharedStyles, colors } = useCalculatorTheme();
  const [legs, setLegs] = useState<NavlogLeg[]>(createDefaultLegs);
  const [settings, setSettings] = useState<NavlogSettings>(DEFAULT_SETTINGS);

  const results = useMemo(
    () => legs.map((leg) => calculateNavlogLeg(leg, settings)),
    [legs, settings]
  );

  const totals = useMemo(() => {
    let distance = 0;
    let timeHours = 0;
    let fuel = 0;
    results.forEach((result, index) => {
      if (!result) return;
      distance += parseNum(legs[index].distance);
      timeHours += result.timeHours;
      fuel += result.fuelUsed;
    });
    return { distance, timeHours, fuel };
  }, [results, legs]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const updateLeg = useCallback((id: string, field: keyof NavlogLeg, value: string) => {
    setLegs((prev) => prev.map((leg) => (leg.id === id ? { ...leg, [field]: value } : leg)));
  }, []);

  const updateSettings = useCallback((patch: Partial<NavlogSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ legs, settings }));
      Alert.alert('Saved', 'Navlog saved on this device.');
    } catch {
      Alert.alert('Error', 'Could not save navlog.');
    }
  }, [legs, settings]);

  const handleLoad = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        Alert.alert('Nothing saved', 'No navlog found on this device.');
        return;
      }
      const parsed = JSON.parse(raw) as { legs: NavlogLeg[]; settings: NavlogSettings };
      if (parsed.legs?.length) setLegs(parsed.legs);
      if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      Alert.alert('Loaded', 'Navlog restored.');
    } catch {
      Alert.alert('Error', 'Could not load navlog.');
    }
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert('Reset navlog?', 'All rows and settings will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setLegs(createDefaultLegs());
          setSettings(DEFAULT_SETTINGS);
        },
      },
    ]);
  }, []);

  const tasColumnLabel = settings.calculateTasFromIas ? 'Ind.\nAir Spd' : 'True\nAir Spd';

  return (
    <CalculatorSafeArea>
      <View style={sharedStyles.scroll}>
        <View style={sharedStyles.scrollContent}>
          <View style={sharedStyles.headerRow}>
            <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
              <Text style={sharedStyles.backBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.titleBlock}>
              <Text style={sharedStyles.title}>NavLog Calculator</Text>
              <Text style={styles.subtitle}>VFR & IFR flight planner</Text>
            </View>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.toolbarRow}>
              <View style={styles.toggleRow}>
                <Switch
                  value={settings.calculateTasFromIas}
                  onValueChange={(value) => updateSettings({ calculateTasFromIas: value })}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor="#ffffff"
                />
                <Text style={styles.toggleLabel}>Calculate TAS using IAS</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                  <Text style={styles.actionBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLoad}>
                  <Text style={styles.actionBtnText}>Load</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleReset}>
                  <Text style={styles.actionBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingsRow}>
              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Fuel burn</Text>
                <View style={styles.settingInputWrap}>
                  <TextInput
                    style={styles.settingInput}
                    value={settings.fuelBurnGph}
                    onChangeText={(value) => updateSettings({ fuelBurnGph: value })}
                    keyboardType="numeric"
                    placeholder="GPH"
                    placeholderTextColor={colors.muted}
                  />
                  <Text style={styles.settingUnit}>GPH</Text>
                </View>
              </View>
              {settings.calculateTasFromIas ? (
                <View style={styles.settingField}>
                  <Text style={styles.settingLabel}>OAT (optional)</Text>
                  <View style={styles.settingInputWrap}>
                    <TextInput
                      style={styles.settingInput}
                      value={settings.oat}
                      onChangeText={(value) => updateSettings({ oat: value })}
                      keyboardType="numeric"
                      placeholder="ISA"
                      placeholderTextColor={colors.muted}
                    />
                    <Text style={styles.settingUnit}>°C</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.tableCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator bounces={false}>
              <View>
                <View style={styles.headerRowTable}>
                  <View style={[styles.rowNumHeader, styles.headerCell]}>
                    <Text style={styles.headerText}>#</Text>
                  </View>
                  {COLUMNS.map((col) => (
                    <View
                      key={col.key}
                      style={[styles.headerCell, { width: col.width }]}>
                      <Text style={styles.headerText}>
                        {col.key === 'tas' ? tasColumnLabel : col.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {legs.map((leg, rowIndex) => (
                  <NavlogRow
                    key={leg.id}
                    leg={leg}
                    rowIndex={rowIndex}
                    result={results[rowIndex]}
                    colors={colors}
                    styles={styles}
                    onUpdate={updateLeg}
                    canRemove={legs.length > 1}
                    onRemove={() => setLegs((prev) => prev.filter((l) => l.id !== leg.id))}
                  />
                ))}

                <View style={styles.footerRow}>
                  <View style={[styles.rowNumCell, styles.footerCell]}>
                    <Text style={styles.footerLabel}>Total</Text>
                  </View>
                  {COLUMNS.map((col) => {
                    let value = '';
                    if (col.key === 'distance') value = formatNavlogNumber(totals.distance, 2);
                    if (col.key === 'timeHours') value = formatNavlogNumber(totals.timeHours, 1);
                    if (col.key === 'fuelUsed') value = formatNavlogNumber(totals.fuel, 1);
                    return (
                      <View
                        key={col.key}
                        style={[styles.footerCell, { width: col.width }]}>
                        <Text style={styles.footerValue}>{value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.addLineBtn}
            onPress={() => setLegs((prev) => [...prev, newLeg(prev.length + 1)])}>
            <Text style={styles.addLineText}>Add New Line</Text>
          </TouchableOpacity>
        </View>
      </View>
    </CalculatorSafeArea>
  );
};

type NavlogRowProps = {
  leg: NavlogLeg;
  rowIndex: number;
  result: NavlogLegResult | null;
  colors: CalculatorColors;
  styles: ReturnType<typeof createStyles>;
  onUpdate: (id: string, field: keyof NavlogLeg, value: string) => void;
  canRemove: boolean;
  onRemove: () => void;
};

function NavlogRow({
  leg,
  rowIndex,
  result,
  colors,
  styles,
  onUpdate,
  canRemove,
  onRemove,
}: NavlogRowProps) {
  const getCalculatedValue = (key: string): string => {
    if (!result) return '';
    const map: Record<string, number> = {
      wca: result.wca,
      trueHeading: result.trueHeading,
      magHeading: result.magHeading,
      compassHeading: result.compassHeading,
      groundSpeed: result.groundSpeed,
      timeHours: result.timeHours,
      fuelUsed: result.fuelUsed,
    };
    const col = COLUMNS.find((c) => c.key === key);
    const value = map[key];
    if (value === undefined) return '';
    return formatNavlogNumber(value, col?.decimals ?? 0);
  };

  return (
    <View style={styles.dataRow}>
      <View style={styles.rowNumCell}>
        <Text style={styles.rowNumText}>{rowIndex + 1}</Text>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Text style={styles.removeRow}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {COLUMNS.map((col) => {
        if (col.editable) {
          const field = col.key as keyof NavlogLeg;
          return (
            <View key={col.key} style={[styles.cell, { width: col.width }]}>
              <TextInput
                style={[styles.cellInput, col.textInput ? styles.cellInputText : null]}
                value={leg[field]}
                onChangeText={(value) => onUpdate(leg.id, field, value)}
                keyboardType={col.textInput ? 'default' : 'numeric'}
                placeholderTextColor={colors.muted}
                placeholder=""
              />
            </View>
          );
        }

        return (
          <View key={col.key} style={[styles.cell, styles.calcCell, { width: col.width }]}>
            <Text style={styles.calcText}>{getCalculatedValue(col.key)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: CalculatorColors) {
  return StyleSheet.create({
    titleBlock: {
      flex: 1,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 2,
    },
    toolbar: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 12,
      gap: 10,
    },
    toolbarRow: {
      gap: 10,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    toggleLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    actionBtnText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    settingsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    settingField: {
      minWidth: 140,
      flex: 1,
    },
    settingLabel: {
      color: colors.muted,
      fontSize: 12,
      marginBottom: 4,
      fontWeight: '500',
    },
    settingInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    settingInput: {
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      color: colors.text,
      fontSize: 15,
    },
    settingUnit: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600',
    },
    tableCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 12,
    },
    headerRowTable: {
      flexDirection: 'row',
      backgroundColor: colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerCell: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    headerText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 13,
    },
    rowNumHeader: {
      width: 36,
    },
    dataRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowNumCell: {
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingVertical: 4,
    },
    rowNumText: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    removeRow: {
      color: colors.error,
      fontSize: 16,
      lineHeight: 18,
      marginTop: 2,
    },
    cell: {
      borderRightWidth: 1,
      borderRightColor: colors.border,
      justifyContent: 'center',
      minHeight: 40,
    },
    cellInput: {
      paddingHorizontal: 4,
      paddingVertical: 6,
      color: colors.text,
      fontSize: 14,
      textAlign: 'center',
    },
    cellInputText: {
      textAlign: 'left',
      fontSize: 12,
    },
    calcCell: {
      backgroundColor: colors.bg,
    },
    calcText: {
      color: colors.muted,
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
    },
    footerRow: {
      flexDirection: 'row',
      backgroundColor: colors.bg,
    },
    footerCell: {
      paddingVertical: 10,
      paddingHorizontal: 4,
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    footerLabel: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '700',
      textAlign: 'center',
    },
    footerValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
    addLineBtn: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 16,
    },
    addLineText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}

export default NavlogCalculatorScreen;
