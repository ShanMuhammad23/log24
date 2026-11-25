import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { MIST, SUB } from '@/constants/Colors';
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
      className="border-b border-rule px-4 py-3 active:bg-paper dark:border-ruleDark dark:active:bg-panel">
      {badge ? (
        <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-arcDeep dark:text-arc">
          {badge}
        </Text>
      ) : null}
      <Text className="text-base text-ink dark:text-white">{airportLabel(airport)}</Text>
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
  const isDark = useColorScheme() === 'dark';
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
          <ActivityIndicator color="#2EA8FF" size="small" />
        </View>
      ) : null}
      {!searching && saved.length === 0 && global.length === 0 ? (
        <Text className="px-4 py-4 text-center text-sm text-sub dark:text-mist">{emptyHint}</Text>
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
          placeholderTextColor={isDark ? MIST : SUB}
          autoCapitalize="characters"
          autoCorrect={false}
          className="flex-1 rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
        />
        <Pressable
          onPress={openModal}
          accessibilityLabel="Open saved airports"
          className="h-12 w-12 items-center justify-center rounded-lg border border-rule bg-paper active:bg-rule dark:border-ruleDark dark:bg-panel dark:active:bg-panel">
          <FontAwesome name="list" size={16} color={isDark ? MIST : SUB} />
        </Pressable>
      </View>

      {showInlineDropdown ? (
        <View className="mt-1 max-h-52 overflow-hidden rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
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
        sheetClassName="max-h-[80%] rounded-t-2xl bg-white px-4 pb-6 pt-4 dark:bg-panel">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-ink dark:text-white">Airports</Text>
          <Pressable onPress={() => setModalOpen(false)}>
            <Text className="text-sm font-semibold text-arc">Close</Text>
          </Pressable>
        </View>

        <TextInput
          value={modalQuery}
          onChangeText={(text) => setModalQuery(text.toUpperCase())}
          placeholder="Search ICAO, IATA, name, city..."
          placeholderTextColor={isDark ? MIST : SUB}
          autoCapitalize="characters"
          autoCorrect={false}
          className="mb-3 rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-night dark:text-white"
        />

        {canSaveCustom ? (
          <Pressable
            onPress={saveTypedCode}
            disabled={adding}
            className="mb-3 flex-row items-center justify-center gap-2 rounded-lg border border-arc/40 bg-arc/10 py-3 active:bg-arc/10 disabled:opacity-60 dark:border-arc/40 dark:bg-arc/10 dark:active:bg-arc/20">
            {adding ? <ActivityIndicator color="#2EA8FF" size="small" /> : <FontAwesome name="plus" size={14} color="#2EA8FF" />}
            <Text className="text-sm font-semibold text-arcDeep dark:text-arc">Save to my airports: {typedCode}</Text>
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
