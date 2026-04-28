import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

type FlightTotalsRow = {
  block_time_minutes: number | null;
  pic_time_minutes: number | null;
  sic_time_minutes: number | null;
  night_time_minutes: number | null;
  operating_capacity: string | null;
  is_cross_country: boolean | null;
  cross_country_total_minutes: number | null;
  ifr_simulated_minutes: number | null;
};

function toHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function CareerScreen() {
  const { session } = useSupabaseSession();
  const [rows, setRows] = useState<FlightTotalsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('flights')
        .select(
          'block_time_minutes,pic_time_minutes,sic_time_minutes,night_time_minutes,operating_capacity,is_cross_country,cross_country_total_minutes,ifr_simulated_minutes'
        )
        .eq('user_id', userId);

      setRows((data || []) as FlightTotalsRow[]);
      setLoading(false);
    };

    load();
  }, [session?.user?.id]);

  const totals = useMemo(() => {
    const total = rows.reduce((acc, row) => acc + (row.block_time_minutes || 0), 0);
    const pic = rows.reduce((acc, row) => acc + (row.pic_time_minutes || 0), 0);
    const copilot = rows.reduce((acc, row) => acc + (row.sic_time_minutes || 0), 0);
    const dual = rows.reduce((acc, row) => {
      if (row.operating_capacity === 'dual') return acc + (row.block_time_minutes || 0);
      return acc;
    }, 0);
    const instruction = rows.reduce((acc, row) => {
      if (row.operating_capacity === 'instructor') return acc + (row.block_time_minutes || 0);
      return acc;
    }, 0);
    const crossCountry = rows.reduce((acc, row) => {
      if ((row.cross_country_total_minutes || 0) > 0) return acc + (row.cross_country_total_minutes || 0);
      if (row.is_cross_country) return acc + (row.block_time_minutes || 0);
      return acc;
    }, 0);
    const simulator = rows.reduce((acc, row) => acc + (row.ifr_simulated_minutes || 0), 0);
    const night = rows.reduce((acc, row) => acc + (row.night_time_minutes || 0), 0);
    const day = Math.max(total - night, 0);

    return [
      ['Total Hours', toHours(total)],
      ['PIC', toHours(pic)],
      ['Co-pilot', toHours(copilot)],
      ['DUAL', toHours(dual)],
      ['Instruction', toHours(instruction)],
      ['Cross Country', toHours(crossCountry)],
      ['Simulator Hours', toHours(simulator)],
      ['Day', toHours(day)],
    ] as const;
  }, [rows]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}>
        <Text className="mb-5 px-1 text-2xl font-bold text-white">Career</Text>

        {loading ? (
          <View className="mt-6 items-center">
            <ActivityIndicator color="#93c5fd" />
          </View>
        ) : (
          <View className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {totals.map(([label, value], index) => (
              <View
                key={label}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  index !== totals.length - 1 ? 'border-b border-slate-800' : ''
                }`}>
                <Text className="text-sm font-medium text-slate-300">{label}</Text>
                <Text className="text-sm font-semibold text-white">{value}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
