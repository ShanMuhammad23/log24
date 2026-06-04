import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import {
  CSV_HEADERS,
  isSpreadsheetFileName,
  loadExistingDuplicateKeys,
  markDatabaseDuplicates,
  parseFlightImportFile,
  ParsedImportRow,
  REQUIRED_CSV_HEADERS,
} from '@/utils/flight-csv-import';
import { supabase } from '@/utils/supabase';

function StatusBadge({ status }: { status: ParsedImportRow['status'] }) {
  if (status === 'ready') {
    return (
      <View className="rounded-full bg-emerald-900/50 px-2.5 py-1">
        <Text className="text-xs font-semibold text-emerald-300">Ready</Text>
      </View>
    );
  }
  if (status === 'duplicate_db' || status === 'duplicate_file') {
    return (
      <View className="rounded-full bg-amber-900/50 px-2.5 py-1">
        <Text className="text-xs font-semibold text-amber-300">Duplicate</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-red-900/50 px-2.5 py-1">
      <Text className="text-xs font-semibold text-red-300">Invalid</Text>
    </View>
  );
}

function PreviewRow({ row }: { row: ParsedImportRow }) {
  const date = row.payload?.flight_date ?? row.raw['Date of Flight'] ?? '—';
  const from = row.payload?.origin_iata ?? row.raw['Flight From'] ?? '—';
  const to = row.payload?.destination_iata ?? row.raw['Flight To'] ?? '—';
  const dep = row.payload?.out_time ?? row.raw['Flight Departure Time'] ?? '—';
  const reg = row.payload?.aircraft_registration ?? row.raw['Aircraft RegVT No'] ?? '—';

  return (
    <View className="mb-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white">
            Row {row.rowNumber}: {from} → {to}
          </Text>
          <Text className="mt-1 text-xs text-slate-400">
            {date} · Dep {dep} · {reg}
          </Text>
          {row.error ? <Text className="mt-1 text-xs text-red-400">{row.error}</Text> : null}
        </View>
        <StatusBadge status={row.status} />
      </View>
    </View>
  );
}

export default function ImportFlightsScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [loadingFile, setLoadingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(() => {
    const ready = rows.filter((r) => r.status === 'ready').length;
    const duplicates = rows.filter((r) => r.status === 'duplicate_db' || r.status === 'duplicate_file').length;
    const invalid = rows.filter((r) => r.status === 'invalid').length;
    return { total: rows.length, ready, duplicates, invalid };
  }, [rows]);

  const pickCsv = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setError('You are not logged in.');
      return;
    }

    setError(null);
    setSuccess(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/csv',
        'text/comma-separated-values',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '*/*',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLoadingFile(true);
    setFileName(asset.name);

    try {
      const response = await fetch(asset.uri);
      const useSpreadsheet =
        isSpreadsheetFileName(asset.name) ||
        asset.mimeType?.includes('spreadsheet') ||
        asset.mimeType?.includes('excel');

      const parsed = useSpreadsheet
        ? parseFlightImportFile(await response.arrayBuffer(), asset.name, userId)
        : parseFlightImportFile(await response.text(), asset.name, userId);

      setMissingHeaders(parsed.missingHeaders);

      if (parsed.missingHeaders.length > 0) {
        setRows([]);
        setError(
          `Missing required columns: ${parsed.missingHeaders.join(', ')}. ` +
            (useSpreadsheet
              ? 'If this is an Excel file, ensure the header row includes Date of Flight.'
              : 'For Excel (.xls/.xlsx), upload the workbook file directly.')
        );
        return;
      }

      const existingKeys = await loadExistingDuplicateKeys(userId, async (uid) => {
        const { data, error: fetchError } = await supabase
          .from('flights')
          .select('flight_date, out_time')
          .eq('user_id', uid);

        if (fetchError) throw new Error(fetchError.message);
        return (data || []) as { flight_date: string; out_time: string | null }[];
      });

      markDatabaseDuplicates(parsed.rows, existingKeys);
      setRows(parsed.rows);

      if (parsed.rows.length === 0) {
        setError('No data rows found in file.');
      }
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : 'Could not read file.');
    } finally {
      setLoadingFile(false);
    }
  };

  const importReadyRows = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setError('You are not logged in.');
      return;
    }

    const toImport = rows.filter((r) => r.status === 'ready' && r.payload);
    if (toImport.length === 0) {
      setError('No rows ready to import.');
      return;
    }

    Alert.alert(
      'Import flights',
      `Import ${toImport.length} flight log(s) into your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setImporting(true);
            setError(null);
            setSuccess(null);

            const payloads = toImport.map((r) => r.payload!);
            const { error: insertError } = await supabase.from('flights').insert(payloads);

            setImporting(false);

            if (insertError) {
              setError(insertError.message);
              return;
            }

            setSuccess(`Imported ${payloads.length} flight(s) successfully.`);
            setRows((prev) =>
              prev.map((row) =>
                row.status === 'ready'
                  ? { ...row, status: 'duplicate_db' as const, error: 'Imported in this session.' }
                  : row
              )
            );
          },
        },
      ]
    );
  }, [rows, session?.user?.id]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#e2e8f0" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">Import Flights</Text>
            <Text className="mt-0.5 text-sm text-slate-400">Upload CSV or Excel (.xls, .xlsx)</Text>
          </View>
        </View>

        <Pressable
          onPress={pickCsv}
          disabled={loadingFile}
          className="mb-4 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/60 bg-blue-950/30 py-4 active:bg-blue-950/50">
          {loadingFile ? (
            <ActivityIndicator color="#93c5fd" />
          ) : (
            <FontAwesome name="file-text-o" size={18} color="#93c5fd" />
          )}
          <Text className="text-base font-semibold text-blue-200">
            {fileName ? 'Choose another file' : 'Select CSV or Excel file'}
          </Text>
        </Pressable>

        {fileName ? <Text className="mb-3 text-sm text-slate-400">File: {fileName}</Text> : null}

        <View className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
          <Text className="mb-2 text-sm font-semibold text-slate-200">Expected columns</Text>
          <Text className="text-xs leading-5 text-slate-500">
            Required: {REQUIRED_CSV_HEADERS.join(', ')}. PIC / Dual / IF columns map into career
            breakdown fields (CCTS, XCTY, GFT, multi checks, dual IF/night/multi). Duplicates are
            skipped when the same <Text className="text-slate-300">Date of Flight</Text> and{' '}
            <Text className="text-slate-300">Flight Departure Time</Text> already exist.
          </Text>
        </View>

        {rows.length > 0 ? (
          <View className="mb-4 flex-row flex-wrap gap-2">
            <View className="rounded-lg bg-slate-800 px-3 py-1.5">
              <Text className="text-xs text-slate-300">Total {stats.total}</Text>
            </View>
            <View className="rounded-lg bg-emerald-900/40 px-3 py-1.5">
              <Text className="text-xs text-emerald-300">Ready {stats.ready}</Text>
            </View>
            <View className="rounded-lg bg-amber-900/40 px-3 py-1.5">
              <Text className="text-xs text-amber-300">Duplicate {stats.duplicates}</Text>
            </View>
            <View className="rounded-lg bg-red-900/40 px-3 py-1.5">
              <Text className="text-xs text-red-300">Invalid {stats.invalid}</Text>
            </View>
          </View>
        ) : null}

        {error ? <Text className="mb-3 text-sm text-red-400">{error}</Text> : null}
        {success ? <Text className="mb-3 text-sm text-emerald-400">{success}</Text> : null}
        {missingHeaders.length > 0 ? (
          <Text className="mb-3 text-sm text-amber-400">
            Missing headers: {missingHeaders.join(', ')}
          </Text>
        ) : null}

        {rows.map((row) => (
          <PreviewRow key={`${row.rowNumber}-${row.duplicateKey ?? 'x'}`} row={row} />
        ))}

        {rows.length > 0 ? (
          <Pressable
            onPress={importReadyRows}
            disabled={importing || stats.ready === 0}
            className="mt-4 items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-50">
            {importing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Import Data ({stats.ready})
              </Text>
            )}
          </Pressable>
        ) : null}

        
      </ScrollView>
    </SafeAreaView>
  );
}
