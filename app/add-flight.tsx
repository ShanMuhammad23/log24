import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CollapsibleCategoryRow } from '@/components/flight-form/CollapsibleCategoryRow';
import { useSupabaseSession } from '@/utils/auth';
import {
  blockMinutesFromOutIn,
  buildFlightSavePayload,
  countDualBreakdownSelections,
  fetchLastFlightDefaults,
  formatDateISO,
  formatDuration,
  formatTimeFromDb,
  isCompleteTimeEntry,
  minutesToHHMM,
  toMinutes,
  validateDualBreakdown,
  type FlightSaveInput,
} from '@/utils/flight-form';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { AirportSearchField } from '@/components/flight-form/AirportSearchField';
import { PicBreakdownSection } from '@/components/flight-form/PicBreakdownSection';
import { SearchablePresetField } from '@/components/flight-form/SearchablePresetField';
import {
  addUserSavedAirport,
  fetchUserSavedAirports,
  mergeSavedAirport,
  saveUserAirportByCode,
  type AirportOption,
} from '@/utils/airports';
import {
  addFlightFieldPreset,
  emptyFlightFieldPresets,
  fetchFlightFieldPresets,
  mergePresetOption,
  syncFlightFieldPresetsFromForm,
  type FlightFieldPresetsMap,
  type FlightFieldType,
} from '@/utils/flight-field-presets';
import { DEFAULT_CAPACITY_OPTIONS, getProfile } from '@/utils/profile';
import {
  EMPTY_PIC_BREAKDOWN,
  picBreakdownFormFromRow,
  validatePicBreakdown,
  type PicBreakdownFormState,
} from '@/utils/pic-breakdown';
import { supabase } from '@/utils/supabase';

type FlightFormRow = {
  flight_date: string;
  flight_number: string | null;
  aircraft_type: string | null;
  aircraft_registration: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  block_time_minutes: number | null;
  night_time_minutes: number | null;
  instrument_time_minutes: number | null;
  instrument_timings_minutes: number | null;
  ifr_actual_minutes: number | null;
  ifr_simulated_minutes: number | null;
  cross_country_total_minutes: number | null;
  operating_capacity: string | null;
  pic_name: string | null;
  co_pilot_name: string | null;
  out_time: string | null;
  in_time: string | null;
  route_points: string | null;
  distance_nm: number | null;
  remarks: string | null;
  signature_url: string | null;
  takeoffs: number | null;
  landings: number | null;
  go_arounds: number | null;
  dual_extra_minutes: number | null;
  dual_night_minutes: number | null;
  dual_if_minutes: number | null;
  dual_multi_minutes: number | null;
  pic_ccts_day_minutes: number | null;
  pic_ccts_night_minutes: number | null;
  pic_xcty_minutes: number | null;
  pic_night_category_minutes: number | null;
  pic_gft_300nm_minutes: number | null;
  pic_gft_250nm_minutes: number | null;
  pic_gft_120nm_minutes: number | null;
  pic_gft_day_minutes: number | null;
  pic_gft_night_minutes: number | null;
  pic_multi_day_minutes: number | null;
  pic_multi_night_minutes: number | null;
  pic_multi_irt_minutes: number | null;
};

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 flex-row items-center gap-3">
      <Text className="w-36 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {label}
        {required ? <Text className="text-base font-bold text-red-600 dark:text-red-500"> *</Text> : null}
      </Text>
      <View className="flex-1">{children}</View>
    </View>
  );
}

function DualCategoryRow({
  label,
  enabled,
  onEnabledChange,
  time,
  onTimeChange,
  blockMinutes,
  showTimeInput,
}: {
  label: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  time: string;
  onTimeChange: (value: string) => void;
  blockMinutes: number | null;
  showTimeInput: boolean;
}) {
  const exceedsBlock =
    enabled &&
    showTimeInput &&
    blockMinutes !== null &&
    blockMinutes > 0 &&
    (() => {
      const minutes = toMinutes(time);
      return minutes !== null && minutes > blockMinutes;
    })();

  return (
    <CollapsibleCategoryRow
      label={label}
      expanded={enabled}
      onExpandedChange={onEnabledChange}>
      {showTimeInput ? (
        <View>
          <TextField value={time} onChangeText={onTimeChange} placeholder="HH:MM" keyboardType="numeric" />
          {blockMinutes !== null && blockMinutes > 0 ? (
            <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Max {formatDuration(blockMinutes)} (block time)
            </Text>
          ) : null}
          {exceedsBlock ? (
            <Text className="mt-1 text-xs text-red-400">Cannot exceed block time.</Text>
          ) : null}
        </View>
      ) : null}
    </CollapsibleCategoryRow>
  );
}

function RoleHoursContainer({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <Text className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">{title}</Text>
      {subtitle ? (
        <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</Text>
      ) : null}
      <View className="mt-3">{children}</View>
    </View>
  );
}

function TextField({
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  keyboardType?: 'default' | 'number-pad' | 'numeric';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#64748b"
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    />
  );
}

export default function AddFlightScreen() {
  const router = useRouter();
  const { id: editFlightId } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(editFlightId);
  const { session } = useSupabaseSession();
  const [loadingFlight, setLoadingFlight] = useState(Boolean(editFlightId));
  const [prefilling, setPrefilling] = useState(!isEditing);

  const [date, setDate] = useState(() => (isEditing ? '' : formatDateISO(new Date())));
  const [flightNo, setFlightNo] = useState('');
  const [registration, setRegistration] = useState('');
  const [aircraftType, setAircraftType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [picName, setPicName] = useState('');
  const [coPilotName, setCoPilotName] = useState('');
  const [crossCountryTotal, setCrossCountryTotal] = useState('');
  const [routePoints, setRoutePoints] = useState('');
  const [distance, setDistance] = useState('');
  const [remarks, setRemarks] = useState('');
  const [signature, setSignature] = useState('');
  const [dualExtraEnabled, setDualExtraEnabled] = useState(false);
  const [dualExtraTime, setDualExtraTime] = useState('');
  const [dualNightEnabled, setDualNightEnabled] = useState(false);
  const [dualNightTime, setDualNightTime] = useState('');
  const [dualIfEnabled, setDualIfEnabled] = useState(false);
  const [dualIfTime, setDualIfTime] = useState('');
  const [dualMultiEnabled, setDualMultiEnabled] = useState(false);
  const [dualMultiTime, setDualMultiTime] = useState('');
  const [picBreakdown, setPicBreakdown] = useState<PicBreakdownFormState>(EMPTY_PIC_BREAKDOWN);
  const [operatingCapacity, setOperatingCapacity] = useState<string | null>(null);
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [outTime, setOutTime] = useState('');
  const [inTime, setInTime] = useState('');
  const [takeoffs, setTakeoffs] = useState('');
  const [landings, setLandings] = useState('');
  const [goArounds, setGoArounds] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldPresets, setFieldPresets] = useState<FlightFieldPresetsMap>(() => emptyFlightFieldPresets());
  const [savedAirports, setSavedAirports] = useState<AirportOption[]>([]);
  const inTimeRef = useRef<TextInput>(null);
  const outTimeWasCompleteRef = useRef(false);

  const blockMinutes = useMemo(() => blockMinutesFromOutIn(outTime, inTime), [outTime, inTime]);

  const showPicBreakdown = operatingCapacity === 'pic';
  const showDualBreakdown = operatingCapacity === 'dual';

  const totalTime = useMemo(() => {
    if (blockMinutes === null) return '--:--';
    return formatDuration(blockMinutes);
  }, [blockMinutes]);

  // When Out/In block time shrinks, cap enabled dual child durations to the new block maximum.
  useEffect(() => {
    if (blockMinutes === null) return;

    const capTime = (current: string) => {
      if (!current.trim()) return current;
      const minutes = toMinutes(current);
      if (minutes !== null && minutes > blockMinutes) {
        return minutesToHHMM(blockMinutes);
      }
      return current;
    };

    setDualExtraTime((current) => capTime(current));
    setDualNightTime((current) => capTime(current));
    setDualIfTime((current) => capTime(current));
    setDualMultiTime((current) => capTime(current));

    setPicBreakdown((current) => ({
      ...current,
      cctsTime: capTime(current.cctsTime),
      xctyTime: capTime(current.xctyTime),
      nightCategoryTime: capTime(current.nightCategoryTime),
      gft300nmTime: capTime(current.gft300nmTime),
      gft250nmTime: capTime(current.gft250nmTime),
      gft120nmTime: capTime(current.gft120nmTime),
      gftDayTime: capTime(current.gftDayTime),
      gftNightTime: capTime(current.gftNightTime),
      multiDayTime: capTime(current.multiDayTime),
      multiNightTime: capTime(current.multiNightTime),
      multiIrtTime: capTime(current.multiIrtTime),
    }));
  }, [blockMinutes]);

  const formInput = useMemo<FlightSaveInput>(
    () => ({
      date,
      flightNo,
      registration,
      aircraftType,
      from,
      to,
      operatingCapacity: operatingCapacity || '',
      outTime,
      inTime,
      picName,
      coPilotName,
      crossCountryTotal,
      routePoints,
      distance,
      remarks,
      signature,
      takeoffs,
      landings,
      goArounds,
      dualExtraEnabled,
      dualExtraTime,
      dualNightEnabled,
      dualNightTime,
      dualIfEnabled,
      dualIfTime,
      dualMultiEnabled,
      dualMultiTime,
      picBreakdown,
    }),
    [
      date,
      flightNo,
      registration,
      aircraftType,
      from,
      to,
      operatingCapacity,
      outTime,
      inTime,
      picName,
      coPilotName,
      crossCountryTotal,
      routePoints,
      distance,
      remarks,
      signature,
      takeoffs,
      landings,
      goArounds,
      dualExtraEnabled,
      dualExtraTime,
      dualNightEnabled,
      dualNightTime,
      dualIfEnabled,
      dualIfTime,
      dualMultiEnabled,
      dualMultiTime,
      picBreakdown,
    ]
  );

  const dualSelectionCount = useMemo(
    () => countDualBreakdownSelections(formInput),
    [formInput]
  );
  const showDualTimeInputs = dualSelectionCount >= 2;

  const saveAirportForUser = async (airport: AirportOption) => {
    const userId = session?.user?.id;
    if (!userId) return { error: 'You are not logged in.' };
    const { airport: saved, error } = await addUserSavedAirport(userId, airport);
    if (!error) setSavedAirports((prev) => mergeSavedAirport(prev, saved));
    return { error };
  };

  const addFieldPreset = (fieldType: FlightFieldType) => async (raw: string) => {
    const userId = session?.user?.id;
    if (!userId) {
      return { error: 'You are not logged in.' };
    }

    const { value, error: addError } = await addFlightFieldPreset(userId, fieldType, raw);
    if (addError) {
      return { error: addError };
    }

    setFieldPresets((prev) => ({
      ...prev,
      [fieldType]: mergePresetOption(prev[fieldType], value),
    }));
    return { error: null };
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setPrefilling(false);
      setLoadingFlight(false);
      setFieldPresets(emptyFlightFieldPresets());
      setSavedAirports([]);
      return;
    }

    let presetsCancelled = false;
    fetchFlightFieldPresets(userId).then((presets) => {
      if (!presetsCancelled) setFieldPresets(presets);
    });
    fetchUserSavedAirports(userId).then((airports) => {
      if (!presetsCancelled) setSavedAirports(airports);
    });

    if (isEditing && editFlightId) {
      let cancelled = false;

      const loadFlight = async () => {
        setLoadingFlight(true);
        setError(null);

        const { data, error: loadError } = await supabase
          .from('flights')
          .select(
            'flight_date, flight_number, aircraft_type, aircraft_registration, origin_iata, destination_iata, block_time_minutes, night_time_minutes, instrument_time_minutes, instrument_timings_minutes, ifr_actual_minutes, ifr_simulated_minutes, cross_country_total_minutes, operating_capacity, pic_name, co_pilot_name, out_time, in_time, route_points, distance_nm, remarks, signature_url, takeoffs, landings, go_arounds, dual_extra_minutes, dual_night_minutes, dual_if_minutes, dual_multi_minutes, pic_ccts_day_minutes, pic_ccts_night_minutes, pic_xcty_minutes, pic_night_category_minutes, pic_gft_300nm_minutes, pic_gft_250nm_minutes, pic_gft_120nm_minutes, pic_gft_day_minutes, pic_gft_night_minutes, pic_multi_day_minutes, pic_multi_night_minutes, pic_multi_irt_minutes'
          )
          .eq('id', editFlightId)
          .eq('user_id', userId)
          .maybeSingle<FlightFormRow>();

        if (cancelled) return;

        if (loadError || !data) {
          setError(loadError?.message || 'Flight not found.');
          setLoadingFlight(false);
          return;
        }

        setDate(data.flight_date);
        setFlightNo(data.flight_number || '');
        setRegistration(data.aircraft_registration || '');
        setAircraftType(data.aircraft_type || '');
        setFrom(data.origin_iata || '');
        setTo(data.destination_iata || '');
        setPicName(data.pic_name || '');
        setCoPilotName(data.co_pilot_name || '');
        setOutTime(formatTimeFromDb(data.out_time));
        setInTime(formatTimeFromDb(data.in_time));
        setCrossCountryTotal(minutesToHHMM(data.cross_country_total_minutes));
        setRoutePoints(data.route_points || '');
        setDistance(data.distance_nm != null ? String(data.distance_nm) : '');
        setRemarks(data.remarks || '');
        setSignature(data.signature_url || '');
        setTakeoffs(String(data.takeoffs ?? 1));
        setLandings(String(data.landings ?? 1));
        setGoArounds(String(data.go_arounds ?? 0));
        setOperatingCapacity(data.operating_capacity);

        const loadDualField = (
          minutes: number | null | undefined,
          setEnabled: (value: boolean) => void,
          setTime: (value: string) => void
        ) => {
          if ((minutes || 0) > 0) {
            setEnabled(true);
            setTime(minutesToHHMM(minutes));
            return;
          }
          setEnabled(false);
          setTime('');
        };

        loadDualField(data.dual_extra_minutes, setDualExtraEnabled, setDualExtraTime);
        loadDualField(data.dual_night_minutes, setDualNightEnabled, setDualNightTime);
        loadDualField(data.dual_if_minutes, setDualIfEnabled, setDualIfTime);
        loadDualField(data.dual_multi_minutes, setDualMultiEnabled, setDualMultiTime);
        setPicBreakdown(picBreakdownFormFromRow(data));

        // Legacy rows saved before dual breakdown columns existed.
        if (
          !data.dual_extra_minutes &&
          !data.dual_night_minutes &&
          !data.dual_if_minutes &&
          !data.dual_multi_minutes
        ) {
          loadDualField(data.night_time_minutes, setDualNightEnabled, setDualNightTime);
          loadDualField(
            data.ifr_actual_minutes ?? data.instrument_timings_minutes ?? data.instrument_time_minutes,
            setDualIfEnabled,
            setDualIfTime
          );
        }

        setLoadingFlight(false);
      };

      loadFlight();
      return () => {
        cancelled = true;
        presetsCancelled = true;
      };
    }

    let cancelled = false;

    const prefillNewFlight = async () => {
      setPrefilling(true);
      setDate(formatDateISO(new Date()));

      const [{ data: lastFlight }, { data: profile }] = await Promise.all([
        fetchLastFlightDefaults(userId),
        getProfile(userId),
      ]);

      if (cancelled) return;

      if (profile?.default_operating_capacity) {
        setOperatingCapacity(profile.default_operating_capacity);
      } else if (lastFlight?.operating_capacity) {
        setOperatingCapacity(lastFlight.operating_capacity);
      }

      setPrefilling(false);
    };

    prefillNewFlight();

    return () => {
      cancelled = true;
      presetsCancelled = true;
    };
  }, [editFlightId, isEditing, session?.user?.id]);

  const saveFlight = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setError('You are not logged in. Please login again.');
      return;
    }

    if (
      !date.trim() ||
      !registration.trim() ||
      !from.trim() ||
      !to.trim() ||
      !operatingCapacity
    ) {
      setError('Please fill all required fields (*) before saving.');
      return;
    }

    if (!picName.trim()) {
      setError('PIC name is required.');
      return;
    }

    if (showDualBreakdown) {
      const dualError = validateDualBreakdown(formInput, blockMinutesFromOutIn(outTime, inTime));
      if (dualError) {
        setError(dualError);
        return;
      }
    }

    if (showPicBreakdown) {
      const picError = validatePicBreakdown(picBreakdown, blockMinutesFromOutIn(outTime, inTime));
      if (picError) {
        setError(picError);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = buildFlightSavePayload(formInput);

    const saveError = isEditing
      ? (
          await supabase
            .from('flights')
            .update(payload)
            .eq('id', editFlightId!)
            .eq('user_id', userId)
        ).error
      : (await supabase.from('flights').insert({ ...payload, user_id: userId })).error;

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    await syncFlightFieldPresetsFromForm(userId, {
      flight_number: flightNo,
      aircraft_registration: registration,
      aircraft_type: aircraftType,
      pic_name: picName,
      co_pilot_name: coPilotName,
    });
    await Promise.all([saveUserAirportByCode(userId, from), saveUserAirportByCode(userId, to)]);
    const [refreshed, refreshedAirports] = await Promise.all([
      fetchFlightFieldPresets(userId),
      fetchUserSavedAirports(userId),
    ]);
    setFieldPresets(refreshed);
    setSavedAirports(refreshedAirports);

    setSuccess(isEditing ? 'Flight updated successfully.' : 'Flight saved successfully.');
    if (isEditing) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const busy = loadingFlight || prefilling;

  const handleOutTimeChange = (text: string) => {
    setOutTime(text);
    const complete = isCompleteTimeEntry(text);
    if (complete && !outTimeWasCompleteRef.current) {
      inTimeRef.current?.focus();
    }
    outTimeWasCompleteRef.current = complete;
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#64748b" />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Flight' : 'Log Flight'}
          </Text>
        </View>

        {busy ? (
          <View className="mb-4 items-center py-8">
            <ActivityIndicator color="#60a5fa" />
            <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {isEditing ? 'Loading flight...' : 'Preparing form...'}
            </Text>
          </View>
        ) : null}

        <FieldRow label="Date" required>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </FieldRow>

        <FieldRow label="Flight No.">
          <SearchablePresetField
            value={flightNo}
            onChange={setFlightNo}
            options={fieldPresets.flight_number}
            placeholder="e.g. AI302"
            onAddNew={addFieldPreset('flight_number')}
            autoCapitalize="characters"
          />
        </FieldRow>
        <FieldRow label="Registration" required>
          <SearchablePresetField
            value={registration}
            onChange={setRegistration}
            options={fieldPresets.aircraft_registration}
            placeholder="e.g. VT-ABC"
            onAddNew={addFieldPreset('aircraft_registration')}
            autoCapitalize="characters"
          />
        </FieldRow>
        <FieldRow label="A/c Type">
          <SearchablePresetField
            value={aircraftType}
            onChange={setAircraftType}
            options={fieldPresets.aircraft_type}
            placeholder="e.g. DA40"
            onAddNew={addFieldPreset('aircraft_type')}
            autoCapitalize="characters"
          />
        </FieldRow>
        <FieldRow label="From" required>
          <AirportSearchField
            value={from}
            onChange={setFrom}
            placeholder="ICAO / IATA — e.g. VIDP"
            userId={session?.user?.id}
            savedAirports={savedAirports}
            onSavedAirportsChange={setSavedAirports}
            onSaveAirport={saveAirportForUser}
          />
        </FieldRow>
        <FieldRow label="To" required>
          <AirportSearchField
            value={to}
            onChange={setTo}
            placeholder="ICAO / IATA — e.g. VABB"
            userId={session?.user?.id}
            savedAirports={savedAirports}
            onSavedAirportsChange={setSavedAirports}
            onSaveAirport={saveAirportForUser}
          />
        </FieldRow>

        <FieldRow label="Operating Capacity" required>
          <Pressable
            onPress={() => setCapacityOpen(true)}
            className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <Text
              className={`text-base ${operatingCapacity ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              {DEFAULT_CAPACITY_OPTIONS.find((c) => c.value === operatingCapacity)?.label || 'Select capacity'}
            </Text>
            <FontAwesome name="chevron-down" size={13} color="#94a3b8" />
          </Pressable>
        </FieldRow>

        <FieldRow label="Out Time">
          <TextInput
            value={outTime}
            onChangeText={handleOutTimeChange}
            onSubmitEditing={() => inTimeRef.current?.focus()}
            returnKeyType="next"
            blurOnSubmit={false}
            placeholder="HH:MM or 0930"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </FieldRow>
        <FieldRow label="In Time">
          <TextInput
            ref={inTimeRef}
            value={inTime}
            onChangeText={setInTime}
            placeholder="HH:MM or 1030"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </FieldRow>
        <View className="mb-4 ml-[9.75rem] rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/40">
          <Text className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Total block time
          </Text>
          <Text className="mt-0.5 text-2xl font-bold text-blue-800 dark:text-blue-200">{totalTime}</Text>
        </View>

        <FieldRow label="PIC Name" required>
          <SearchablePresetField
            value={picName}
            onChange={setPicName}
            options={fieldPresets.pic_name}
            placeholder="Pilot in command"
            onAddNew={addFieldPreset('pic_name')}
            autoCapitalize="words"
          />
        </FieldRow>
        <FieldRow label="Co Pilot">
          <SearchablePresetField
            value={coPilotName}
            onChange={setCoPilotName}
            options={fieldPresets.co_pilot_name}
            placeholder="Instructor / co-pilot"
            onAddNew={addFieldPreset('co_pilot_name')}
            autoCapitalize="words"
          />
        </FieldRow>

        <View className="mb-4 flex-row gap-2">
          {[
            ['Takeoffs', takeoffs, setTakeoffs],
            ['Landings', landings, setLandings],
            ['Go Around', goArounds, setGoArounds],
          ].map(([label, value, setter]) => (
            <View key={label as string} className="flex-1">
              <Text className="mb-1.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {label as string}
              </Text>
              <TextInput
                value={value as string}
                onChangeText={setter as (v: string) => void}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-center text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </View>
          ))}
        </View>

        <FieldRow label="X-C Total">
          <TextField value={crossCountryTotal} onChangeText={setCrossCountryTotal} placeholder="HH:MM" keyboardType="numeric" />
        </FieldRow>
        <FieldRow label="Route">
          <TextField value={routePoints} onChangeText={setRoutePoints} placeholder="VOR / waypoints" />
        </FieldRow>
        <FieldRow label="Distance">
          <TextField value={distance} onChangeText={setDistance} placeholder="NM" keyboardType="numeric" />
        </FieldRow>
        <FieldRow label="Remarks">
          <TextField value={remarks} onChangeText={setRemarks} placeholder="Any notes" />
        </FieldRow>

        {showPicBreakdown ? (
          <RoleHoursContainer title="PIC" subtitle="Log PIC hours by category">
            <PicBreakdownSection
              value={picBreakdown}
              onChange={setPicBreakdown}
              blockMinutes={blockMinutes}
            />
          </RoleHoursContainer>
        ) : null}

        {showDualBreakdown ? (
          <RoleHoursContainer title="Dual" subtitle="Toggle categories to log dual hours">
            {dualSelectionCount === 1 && blockMinutes !== null && blockMinutes > 0 ? (
              <Text className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Block time ({formatDuration(blockMinutes)}) will apply to the selected category.
              </Text>
            ) : null}
            <DualCategoryRow
              label="Extra / Other"
              enabled={dualExtraEnabled}
              onEnabledChange={setDualExtraEnabled}
              time={dualExtraTime}
              onTimeChange={setDualExtraTime}
              blockMinutes={blockMinutes}
              showTimeInput={showDualTimeInputs}
            />
            <DualCategoryRow
              label="Night"
              enabled={dualNightEnabled}
              onEnabledChange={setDualNightEnabled}
              time={dualNightTime}
              onTimeChange={setDualNightTime}
              blockMinutes={blockMinutes}
              showTimeInput={showDualTimeInputs}
            />
            <DualCategoryRow
              label="IF"
              enabled={dualIfEnabled}
              onEnabledChange={setDualIfEnabled}
              time={dualIfTime}
              onTimeChange={setDualIfTime}
              blockMinutes={blockMinutes}
              showTimeInput={showDualTimeInputs}
            />
            <DualCategoryRow
              label="Multi"
              enabled={dualMultiEnabled}
              onEnabledChange={setDualMultiEnabled}
              time={dualMultiTime}
              onTimeChange={setDualMultiTime}
              blockMinutes={blockMinutes}
              showTimeInput={showDualTimeInputs}
            />
          </RoleHoursContainer>
        ) : null}

        {error ? <Text className="mb-3 text-sm text-red-400">{error}</Text> : null}
        {success ? <Text className="mb-3 text-sm text-emerald-400">{success}</Text> : null}

        <Pressable
          onPress={saveFlight}
          disabled={saving || busy}
          className="items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-60">
          <Text className="text-base font-semibold text-white">
            {saving ? (isEditing ? 'Updating...' : 'Saving...') : isEditing ? 'Update Flight' : 'Save Flight'}
          </Text>
        </Pressable>
      </ScrollView>

      <BottomSheetModal
        visible={capacityOpen}
        onClose={() => setCapacityOpen(false)}
        sheetClassName="max-h-[70%] rounded-t-2xl bg-white px-4 pb-6 pt-4 dark:bg-slate-900">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Operating Capacity</Text>
          <Pressable onPress={() => setCapacityOpen(false)}>
            <Text className="text-sm font-semibold text-blue-400">Close</Text>
          </Pressable>
        </View>
        <ScrollView>
          {DEFAULT_CAPACITY_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                setOperatingCapacity(option.value);
                setCapacityOpen(false);
              }}
              className="flex-row items-center justify-between border-b border-slate-200 py-4 dark:border-slate-800">
              <Text className="text-base text-slate-800 dark:text-slate-100">{option.label}</Text>
              {option.value === operatingCapacity ? <FontAwesome name="check" size={14} color="#60a5fa" /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}
