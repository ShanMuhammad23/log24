import { useState } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MIST, NIGHT, SUB } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetarReportCard } from '@/components/weather/MetarReportCard';
import { fetchMetarForStation, parseStationIds } from '@/utils/metar-client';
import { MetarReport } from '@/utils/aviation-weather';

type StationResult = {
  stationId: string;
  reports: MetarReport[];
  error: string | null;
};

export default function WeatherScreen() {
  const isDark = useColorScheme() === 'dark';
  const [stationId, setStationId] = useState('');
  const [stationResults, setStationResults] = useState<StationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFetch = async () => {
    const ids = parseStationIds(stationId);
    if (ids.length === 0) {
      setError('Enter one or more ICAO station IDs (e.g. KMCI or KMCI, KJFK).');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setStationResults([]);

    try {
      const results = await Promise.all(
        ids.map(async (id): Promise<StationResult> => {
          try {
            const reports = await fetchMetarForStation(id);
            if (reports.length === 0) {
              return {
                stationId: id,
                reports: [],
                error: `No METAR/TAF reports found for ${id}.`,
              };
            }
            return { stationId: id, reports, error: null };
          } catch (err) {
            return {
              stationId: id,
              reports: [],
              error: err instanceof Error ? err.message : 'Could not load weather data.',
            };
          }
        }),
      );

      setStationResults(results);

      if (results.every((result) => result.error)) {
        setError(
          results.length === 1
            ? results[0].error
            : 'No weather data found for the entered station IDs.',
        );
      }
    } catch (err) {
      setStationResults([]);
      setError(err instanceof Error ? err.message : 'Could not load weather data.');
    } finally {
      setLoading(false);
    }
  };

  const hasAnyReports = stationResults.some((result) => result.reports.length > 0);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper dark:bg-night">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <Text className="mb-1 text-2xl font-bold text-ink dark:text-white">Weather</Text>
        <Text className="mb-5 text-sm text-sub dark:text-mist">
          Airport METAR &amp; TAF from Aviation Weather
        </Text>

        <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">
          Station ID (ICAO)
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            value={stationId}
            onChangeText={(text) => setStationId(text.toUpperCase())}
            placeholder="KMCI or KMCI, KJFK"
            placeholderTextColor={isDark ? MIST : SUB}
            autoCapitalize="characters"
            autoCorrect={false}
            className="h-12 flex-1 rounded-lg border border-rule bg-white px-4 font-mono text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
            onSubmitEditing={handleFetch}
            returnKeyType="search"
          />
          <Pressable
            onPress={handleFetch}
            disabled={loading}
            className="h-12 items-center justify-center rounded-lg bg-arc px-5 active:opacity-90 disabled:opacity-60">
            {loading ? (
              <ActivityIndicator color={NIGHT} />
            ) : (
              <Text className="text-base font-semibold text-night">Get</Text>
            )}
          </Pressable>
        </View>
        <Text className="mt-1.5 text-xs text-sub dark:text-mist">
          Separate multiple airports with commas
        </Text>

        {error && !hasAnyReports ? (
          <Text className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</Text>
        ) : null}

        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color="#2EA8FF" />
            <Text className="mt-3 text-sm text-sub dark:text-mist">Fetching reports…</Text>
          </View>
        ) : null}

        {!loading && stationResults.length > 0
          ? stationResults.map(({ stationId: id, reports, error: stationError }) => (
              <View key={id} className="mt-6">
                <Text className="mb-2 text-base font-semibold text-ink dark:text-white">{id}</Text>

                {stationError ? (
                  <View className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/60 dark:bg-red-950/40">
                    <Text className="text-sm text-red-600 dark:text-red-400">{stationError}</Text>
                  </View>
                ) : null}

                {reports.map((report, index) => (
                  <View key={`${report.icaoId}-${report.reportTime}-${index}`} className="mt-3">
                    <MetarReportCard report={report} index={index} />
                  </View>
                ))}
              </View>
            ))
          : null}

        {!loading && hasSearched && stationResults.length === 0 && !error ? (
          <Text className="mt-6 text-center text-sm text-sub dark:text-mist">
            No data to display.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
