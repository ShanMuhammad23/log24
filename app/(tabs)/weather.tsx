import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetarReportCard } from '@/components/weather/MetarReportCard';
import { fetchMetarForStation } from '@/utils/metar-client';
import { MetarReport } from '@/utils/aviation-weather';

export default function WeatherScreen() {
  const [stationId, setStationId] = useState('');
  const [reports, setReports] = useState<MetarReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFetch = async () => {
    const ids = stationId.trim().toUpperCase();
    if (!ids) {
      setError('Enter an airport station ID (e.g. KMCI).');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await fetchMetarForStation(ids);
      setReports(data);
      if (data.length === 0) {
        setError(`No METAR/TAF reports found for ${ids}.`);
      }
    } catch (err) {
      setReports([]);
      setError(err instanceof Error ? err.message : 'Could not load weather data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <Text className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Weather</Text>
        <Text className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          Airport METAR &amp; TAF from Aviation Weather
        </Text>

        <Text className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Station ID (ICAO)</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={stationId}
            onChangeText={(text) => setStationId(text.toUpperCase())}
            placeholder="Enter ICAO Code"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            onSubmitEditing={handleFetch}
            returnKeyType="search"
          />
          <Pressable
            onPress={handleFetch}
            disabled={loading}
            className="h-12 items-center justify-center rounded-xl bg-blue-600 px-5 active:bg-blue-700 disabled:opacity-60">
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Get</Text>
            )}
          </Pressable>
        </View>

        {error ? <Text className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Fetching report…</Text>
          </View>
        ) : null}

        {!loading && reports.length > 0
          ? reports.map((report, index) => (
              <View key={`${report.icaoId}-${report.reportTime}-${index}`} className="mt-5">
                <MetarReportCard report={report} index={index} />
              </View>
            ))
          : null}

        {!loading && hasSearched && reports.length === 0 && !error ? (
          <Text className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">No data to display.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
