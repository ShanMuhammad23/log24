import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import {
  AIRPORT_SEARCH_MIN_CHARS,
  airportLabel,
  airportStorageCode,
  filterUserAirports,
  searchAirportsCombined,
  type AirportOption,
} from '@/utils/airports';

type AirportSearchFieldProps = {
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
  userId: string | undefined;
  savedAirports: AirportOption[];
  onSavedAirportsChange: (airports: AirportOption[]) => void;
  onSaveAirport: (airport: AirportOption) => Promise<{ error: string | null }>;
};

function AirportResultRow({
  airport,
  onSelect,
  badge,
}: {
  airport: AirportOption;
  onSelect: (airport: AirportOption) => void;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={() => onSelect(airport)}
      className="border-b border-slate-200 px-4 py-3 active:bg-slate-100 dark:border-slate-800 dark:active:bg-slate-800">
      {badge ? (
        <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {badge}
        </Text>
      ) : null}
      <Text className="text-base text-slate-800 dark:text-slate-100">{airportLabel(airport)}</Text>
    </Pressable>
  );
}

export function AirportSearchField({
  value,
  onChange,
  placeholder,
  userId,
  savedAirports,
  onSavedAirportsChange,
  onSaveAirport,
}: AirportSearchFieldProps) {
  const [focused, setFocused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState('');
  const [savedResults, setSavedResults] = useState<AirportOption[]>([]);
  const [globalResults, setGlobalResults] = useState<AirportOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);

  const runSearch = useCallback(
    async (query: string) => {
      if (!userId) {
        setSavedResults([]);
        setGlobalResults([]);
        return;
      }

      const requestId = ++searchRequestRef.current;
      const q = query.trim();
      if (q.length > 0 && q.length < AIRPORT_SEARCH_MIN_CHARS) {
        setSavedResults(filterUserAirports(savedAirports, q));
        setGlobalResults([]);
        setSearching(false);
        return;
      }

      setSearching(q.length >= AIRPORT_SEARCH_MIN_CHARS);
      const { saved, global } = await searchAirportsCombined(userId, query, savedAirports);

      if (requestId !== searchRequestRef.current) return;
      setSavedResults(saved);
      setGlobalResults(global);
      setSearching(false);
    },
    [savedAirports, userId]
  );

  useEffect(() => {
    if (!focused && !modalOpen) return;

    const query = modalOpen ? modalQuery : value;
    const timer = setTimeout(() => {
      runSearch(query);
    }, 280);

    return () => clearTimeout(timer);
  }, [focused, modalOpen, modalQuery, value, runSearch]);

  useEffect(() => {
    if (!modalOpen) return;
    runSearch(modalQuery);
  }, [modalOpen, modalQuery, runSearch]);

  const hasInlineResults = savedResults.length > 0 || globalResults.length > 0;
  const showInlineDropdown = focused && (hasInlineResults || searching || value.trim().length >= AIRPORT_SEARCH_MIN_CHARS);

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setFocused(true);
    runSearch(value);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setFocused(false), 200);
  };

  const selectAirport = async (airport: AirportOption) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    const code = airportStorageCode(airport);
    onChange(code);
    setFocused(false);
    setModalOpen(false);
    setModalQuery('');
    setAddError(null);

    if (userId) {
      const { error } = await onSaveAirport(airport);
      if (!error) {
        onSavedAirportsChange(
          [airport, ...savedAirports.filter((a) => a.icao.toUpperCase() !== airport.icao.toUpperCase())].slice(0, 100)
        );
      }
    }
  };

  const openModal = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setFocused(false);
    setModalQuery(value);
    setAddError(null);
    setModalOpen(true);
  };

  const saveTypedCode = async () => {
    const code = (modalOpen ? modalQuery : value).trim().toUpperCase();
    if (!code) {
      setAddError('Enter an ICAO or IATA code.');
      return;
    }
    if (!userId) {
      setAddError('You are not logged in.');
      return;
    }

    setAdding(true);
    setAddError(null);
    const airport: AirportOption = {
      iata: code.length === 3 ? code : null,
      icao: code.length === 4 ? code : code,
      name: code,
      city: null,
    };
    const { error } = await onSaveAirport(airport);
    setAdding(false);
    if (error) {
      setAddError(error);
      return;
    }
    onChange(code);
    onSavedAirportsChange(
      [airport, ...savedAirports.filter((a) => a.icao.toUpperCase() !== airport.icao.toUpperCase())].slice(0, 100)
    );
    setModalOpen(false);
    setModalQuery('');
  };

  const renderResults = (saved: AirportOption[], global: AirportOption[], emptyHint: string) => (
    <>
      {saved.map((airport) => (
        <AirportResultRow key={`saved-${airport.icao}`} airport={airport} onSelect={selectAirport} badge="Saved" />
      ))}
      {global.map((airport) => (
        <AirportResultRow key={`global-${airport.icao}`} airport={airport} onSelect={selectAirport} />
      ))}
      {searching ? (
        <View className="items-center py-4">
          <ActivityIndicator color="#60a5fa" size="small" />
        </View>
      ) : null}
      {!searching && saved.length === 0 && global.length === 0 ? (
        <Text className="px-4 py-4 text-center text-sm text-slate-500">{emptyHint}</Text>
      ) : null}
    </>
  );

  const typedCode = (modalOpen ? modalQuery : value).trim().toUpperCase();
  const canSaveCustom =
    typedCode.length >= 2 &&
    !savedResults.some((a) => airportStorageCode(a) === typedCode) &&
    !globalResults.some((a) => airportStorageCode(a) === typedCode);

  return (
    <View>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.toUpperCase())}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          autoCapitalize="characters"
          autoCorrect={false}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <Pressable
          onPress={openModal}
          accessibilityLabel="Open saved airports"
          className="h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 active:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700">
          <FontAwesome name="list" size={16} color="#94a3b8" />
        </Pressable>
      </View>

      {showInlineDropdown ? (
        <View className="mt-1 max-h-52 overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {renderResults(
              savedResults,
              globalResults,
              value.trim().length < AIRPORT_SEARCH_MIN_CHARS
                ? 'Type 2+ characters to search all airports (ICAO, IATA, name, city).'
                : 'No airports found.'
            )}
          </ScrollView>
        </View>
      ) : null}

      <BottomSheetModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        sheetClassName="max-h-[80%] rounded-t-2xl bg-white px-4 pb-6 pt-4 dark:bg-slate-900">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Airports</Text>
          <Pressable onPress={() => setModalOpen(false)}>
            <Text className="text-sm font-semibold text-blue-400">Close</Text>
          </Pressable>
        </View>

        <TextInput
          value={modalQuery}
          onChangeText={(text) => setModalQuery(text.toUpperCase())}
          placeholder="Search ICAO, IATA, name, city..."
          placeholderTextColor="#64748b"
          autoCapitalize="characters"
          autoCorrect={false}
          className="mb-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        {canSaveCustom ? (
          <Pressable
            onPress={saveTypedCode}
            disabled={adding}
            className="mb-3 flex-row items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-3 active:bg-blue-100 disabled:opacity-60 dark:border-blue-800 dark:bg-blue-950/50 dark:active:bg-blue-900/40">
            {adding ? <ActivityIndicator color="#60a5fa" size="small" /> : <FontAwesome name="plus" size={14} color="#60a5fa" />}
            <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">Save to my airports: {typedCode}</Text>
          </Pressable>
        ) : null}

        {addError ? <Text className="mb-2 text-sm text-red-400">{addError}</Text> : null}

        <ScrollView keyboardShouldPersistTaps="handled">
          {renderResults(
            savedResults,
            globalResults,
            modalQuery.trim().length < AIRPORT_SEARCH_MIN_CHARS
              ? 'Your saved airports appear here. Type 2+ characters to search the full database.'
              : 'No matches. Use Save to add a custom code.'
          )}
        </ScrollView>
      </BottomSheetModal>
    </View>
  );
}
