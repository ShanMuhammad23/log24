import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CalcButton from './components/CalcButton';
import CalculatorSafeArea from './components/CalculatorSafeArea';
import CalcInput from './components/CalcInput';
import CalcResult from './components/CalcResult';
import type { WBItem } from './types';
import { fmt, parseNum } from './utils';
import { useCalculatorTheme } from './theme';

function newItem(index: number): WBItem {
  return { id: `${Date.now()}-${index}`, name: `Item ${index}`, weight: '', arm: '' };
}

const WeightBalanceScreen: React.FC = () => {
  const router = useRouter();
  const { styles: sharedStyles, colors } = useCalculatorTheme();
  const [items, setItems] = useState<WBItem[]>([newItem(1), newItem(2)]);
  const [fwdLimit, setFwdLimit] = useState<string>('');
  const [aftLimit, setAftLimit] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const { totalWeight, cg, inLimits } = useMemo(() => {
    const totalWeight = items.reduce((sum, i) => sum + parseNum(i.weight), 0);
    const totalMoment = items.reduce((sum, i) => sum + parseNum(i.weight) * parseNum(i.arm), 0);
    const cg = totalWeight > 0 ? totalMoment / totalWeight : 0;
    const fwd = parseNum(fwdLimit);
    const aft = parseNum(aftLimit);
    const inLimits =
      totalWeight > 0 && fwdLimit.trim() !== '' && aftLimit.trim() !== '' ? cg >= fwd && cg <= aft : false;
    return { totalWeight, cg, inLimits };
  }, [items, fwdLimit, aftLimit]);

  const updateItem = (id: string, field: keyof WBItem, value: string): void => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        itemHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        remove: {
          color: colors.error,
          fontSize: 13,
          fontWeight: '600',
        },
        add: {
          alignItems: 'center',
          paddingVertical: 12,
        },
        addText: {
          color: colors.accent,
          fontSize: 15,
          fontWeight: '600',
        },
        status: {
          marginTop: 16,
          fontSize: 18,
          fontWeight: '700',
          textAlign: 'center',
        },
        statusOk: {
          color: colors.success,
        },
        statusBad: {
          color: colors.danger,
        },
      }),
    [colors]
  );

  return (
    <CalculatorSafeArea>
      <ScrollView style={sharedStyles.scroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => router.back()}>
            <Text style={sharedStyles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Weight & Balance</Text>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={sharedStyles.card}>
            <View style={styles.itemHeader}>
              <Text style={sharedStyles.sectionTitle}>{item.name}</Text>
              {items.length > 1 ? (
                <TouchableOpacity onPress={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <CalcInput
              label="Name"
              value={item.name}
              onChangeText={(v) => updateItem(item.id, 'name', v)}
              keyboardType="default"
            />
            <CalcInput label="Weight" value={item.weight} onChangeText={(v) => updateItem(item.id, 'weight', v)} unit="lb" />
            <CalcInput label="Arm" value={item.arm} onChangeText={(v) => updateItem(item.id, 'arm', v)} unit="in" />
          </View>
        ))}

        <TouchableOpacity style={styles.add} onPress={() => setItems((prev) => [...prev, newItem(prev.length + 1)])}>
          <Text style={styles.addText}>+ Add item</Text>
        </TouchableOpacity>

        <View style={sharedStyles.card}>
          <CalcInput label="Forward CG limit" value={fwdLimit} onChangeText={setFwdLimit} unit="in" />
          <CalcInput label="Aft CG limit" value={aftLimit} onChangeText={setAftLimit} unit="in" />
        </View>

        <CalcButton onPress={() => setShowResults(true)} />

        {showResults ? (
          <View style={sharedStyles.card}>
            <CalcResult label="Total weight" value={fmt(totalWeight, 1)} unit="lb" />
            <CalcResult label="CG" value={fmt(cg, 2)} unit="in" highlight />
            <Text style={[styles.status, inLimits ? styles.statusOk : styles.statusBad]}>
              {inLimits ? '✓ WITHIN LIMITS' : '✗ OUT OF LIMITS'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </CalculatorSafeArea>
  );
};

export default WeightBalanceScreen;
