import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import {
  blockMinutesFromOutIn,
  buildFlightSavePayload,
  fetchLastFlightDefaults,
  formatDateISO,
  formatDuration,
  formatTimeFromDb,
  minutesToHHMM,
  type FlightSaveInput,
} from '@/utils/flight-form';
import { DEFAULT_CAPACITY_OPTIONS, getProfile } from '@/utils/profile';
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
  is_cross_country: boolean;
  pf_takeoff_landing: boolean;
  stl: boolean;
  multi_crew: boolean;
  ulr_ops: boolean;
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
      <Text className="w-36 text-sm font-semibold text-slate-300">
        {label}
        {required ? ' *' : ''}
      </Text>
      <View className="flex-1">{children}</View>
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
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
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

  const [date, setDate] = useState(() => formatDateISO(new Date()));
  const [flightNo, setFlightNo] = useState('');
  const [registration, setRegistration] = useState('');
  const [aircraftType, setAircraftType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [picName, setPicName] = useState('');
  const [coPilotName, setCoPilotName] = useState('');
  const [night, setNight] = useState('');
  const [ifrActual, setIfrActual] = useState('');
  const [crossCountryTotal, setCrossCountryTotal] = useState('');
  const [routePoints, setRoutePoints] = useState('');
  const [distance, setDistance] = useState('');
  const [remarks, setRemarks] = useState('');
  const [signature, setSignature] = useState('');
  const [instrumentTimings, setInstrumentTimings] = useState('');
  const [ifrSimulated, setIfrSimulated] = useState('');
  const [operatingCapacity, setOperatingCapacity] = useState<string | null>(null);
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [outTime, setOutTime] = useState('');
  const [inTime, setInTime] = useState('');
  const [takeoffs, setTakeoffs] = useState('1');
  const [landings, setLandings] = useState('1');
  const [goArounds, setGoArounds] = useState('0');
  const [isCrossCountry, setIsCrossCountry] = useState(false);
  const [pfTakeoffLanding, setPfTakeoffLanding] = useState(false);
  const [stl, setStl] = useState(false);
  const [multiCrew, setMultiCrew] = useState(false);
  const [ulrOps, setUlrOps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalTime = useMemo(() => {
    const minutes = blockMinutesFromOutIn(outTime, inTime);
    if (minutes === null) return '--:--';
    return formatDuration(minutes);
  }, [outTime, inTime]);

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
      night,
      ifrActual,
      crossCountryTotal,
      instrumentTimings,
      ifrSimulated,
      routePoints,
      distance,
      remarks,
      signature,
      takeoffs,
      landings,
      goArounds,
      isCrossCountry,
      pfTakeoffLanding,
      stl,
      multiCrew,
      ulrOps,
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
      night,
      ifrActual,
      crossCountryTotal,
      instrumentTimings,
      ifrSimulated,
      routePoints,
      distance,
      remarks,
      signature,
      takeoffs,
      landings,
      goArounds,
      isCrossCountry,
      pfTakeoffLanding,
      stl,
      multiCrew,
      ulrOps,
    ]
  );

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setPrefilling(false);
      setLoadingFlight(false);
      return;
    }

    if (isEditing && editFlightId) {
      let cancelled = false;

      const loadFlight = async () => {
        setLoadingFlight(true);
        setError(null);

        const { data, error: loadError } = await supabase
          .from('flights')
          .select(
            'flight_date, flight_number, aircraft_type, aircraft_registration, origin_iata, destination_iata, block_time_minutes, night_time_minutes, instrument_time_minutes, instrument_timings_minutes, ifr_actual_minutes, ifr_simulated_minutes, cross_country_total_minutes, operating_capacity, pic_name, co_pilot_name, out_time, in_time, route_points, distance_nm, remarks, signature_url, takeoffs, landings, go_arounds, is_cross_country, pf_takeoff_landing, stl, multi_crew, ulr_ops'
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
        setNight(minutesToHHMM(data.night_time_minutes));
        setIfrActual(minutesToHHMM(data.ifr_actual_minutes));
        setCrossCountryTotal(minutesToHHMM(data.cross_country_total_minutes));
        setInstrumentTimings(minutesToHHMM(data.instrument_timings_minutes ?? data.instrument_time_minutes));
        setIfrSimulated(minutesToHHMM(data.ifr_simulated_minutes));
        setRoutePoints(data.route_points || '');
        setDistance(data.distance_nm != null ? String(data.distance_nm) : '');
        setRemarks(data.remarks || '');
        setSignature(data.signature_url || '');
        setTakeoffs(String(data.takeoffs ?? 1));
        setLandings(String(data.landings ?? 1));
        setGoArounds(String(data.go_arounds ?? 0));
        setOperatingCapacity(data.operating_capacity);
        setIsCrossCountry(data.is_cross_country);
        setPfTakeoffLanding(data.pf_takeoff_landing);
        setStl(data.stl);
        setMultiCrew(data.multi_crew);
        setUlrOps(data.ulr_ops);
        setLoadingFlight(false);
      };

      loadFlight();
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;

    const prefillNewFlight = async () => {
      setPrefilling(true);
      setDate(formatDateISO(new Date()));

      const [{ data: lastFlight }, profile] = await Promise.all([
        fetchLastFlightDefaults(userId),
        getProfile(userId),
      ]);

      if (cancelled) return;

      if (lastFlight) {
        setFlightNo(lastFlight.flight_number || '');
        setRegistration(lastFlight.aircraft_registration || '');
        setAircraftType(lastFlight.aircraft_type || '');
        setFrom(lastFlight.origin_iata || '');
        setTo(lastFlight.destination_iata || '');
        setCoPilotName(lastFlight.co_pilot_name || '');
        setTakeoffs(String(lastFlight.takeoffs ?? 1));
        setLandings(String(lastFlight.landings ?? 1));
        setGoArounds(String(lastFlight.go_arounds ?? 0));
        if (lastFlight.operating_capacity) setOperatingCapacity(lastFlight.operating_capacity);
        if (lastFlight.pic_name) setPicName(lastFlight.pic_name);
      }

      if (!lastFlight?.pic_name && profile?.full_name) {
        setPicName(profile.full_name);
      }
      if (!lastFlight?.operating_capacity && profile?.default_operating_capacity) {
        setOperatingCapacity(profile.default_operating_capacity);
      }

      setPrefilling(false);
    };

    prefillNewFlight();

    return () => {
      cancelled = true;
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
      !aircraftType.trim() ||
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

    setSuccess(isEditing ? 'Flight updated successfully.' : 'Flight saved successfully.');
    if (isEditing) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const busy = loadingFlight || prefilling;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#e2e8f0" />
          </Pressable>
          <Text className="text-2xl font-bold text-white">{isEditing ? 'Edit Flight' : 'Log Flight'}</Text>
        </View>

        {busy ? (
          <View className="mb-4 items-center py-8">
            <ActivityIndicator color="#60a5fa" />
            <Text className="mt-3 text-sm text-slate-400">{isEditing ? 'Loading flight...' : 'Preparing form...'}</Text>
          </View>
        ) : null}

        <FieldRow label="Date" required>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
          />
        </FieldRow>

        <FieldRow label="Flight No.">
          <TextField value={flightNo} onChangeText={setFlightNo} placeholder="e.g. AI302" />
        </FieldRow>
        <FieldRow label="Registration" required>
          <TextField value={registration} onChangeText={setRegistration} placeholder="e.g. VT-ABC" autoCapitalize="characters" />
        </FieldRow>
        <FieldRow label="A/c Type" required>
          <TextField value={aircraftType} onChangeText={setAircraftType} placeholder="e.g. DA40" autoCapitalize="characters" />
        </FieldRow>
        <FieldRow label="From" required>
          <TextField value={from} onChangeText={setFrom} placeholder="Departure" autoCapitalize="characters" />
        </FieldRow>
        <FieldRow label="To" required>
          <TextField value={to} onChangeText={setTo} placeholder="Arrival" autoCapitalize="characters" />
        </FieldRow>

        <FieldRow label="Operating Capacity" required>
          <Pressable
            onPress={() => setCapacityOpen(true)}
            className="flex-row items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
            <Text className={`text-base ${operatingCapacity ? 'text-white' : 'text-slate-500'}`}>
              {DEFAULT_CAPACITY_OPTIONS.find((c) => c.value === operatingCapacity)?.label || 'Select capacity'}
            </Text>
            <FontAwesome name="chevron-down" size={13} color="#94a3b8" />
          </Pressable>
        </FieldRow>

        <FieldRow label="Out Time">
          <TextField value={outTime} onChangeText={setOutTime} placeholder="HH:MM or 0930" keyboardType="numeric" />
        </FieldRow>
        <FieldRow label="In Time">
          <TextField value={inTime} onChangeText={setInTime} placeholder="HH:MM or 1030" keyboardType="numeric" />
        </FieldRow>
        <View className="mb-4 ml-[9.75rem] rounded-xl border border-blue-900/50 bg-blue-950/40 px-4 py-2.5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-blue-300">Total block time</Text>
          <Text className="mt-0.5 text-2xl font-bold text-blue-200">{totalTime}</Text>
        </View>

        <FieldRow label="PIC Name" required>
          <TextField value={picName} onChangeText={setPicName} placeholder="Pilot in command" autoCapitalize="words" />
        </FieldRow>
        <FieldRow label="Co Pilot">
          <TextField value={coPilotName} onChangeText={setCoPilotName} placeholder="Instructor / co-pilot" autoCapitalize="words" />
        </FieldRow>

        <View className="mb-4 flex-row gap-2">
          {[
            ['Takeoffs', takeoffs, setTakeoffs],
            ['Landings', landings, setLandings],
            ['Go Around', goArounds, setGoArounds],
          ].map(([label, value, setter]) => (
            <View key={label as string} className="flex-1">
              <Text className="mb-1.5 text-xs font-semibold uppercase text-slate-400">{label as string}</Text>
              <TextInput
                value={value as string}
                onChangeText={setter as (v: string) => void}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-center text-base text-white"
              />
            </View>
          ))}
        </View>

        <FieldRow label="Night">
          <TextField value={night} onChangeText={setNight} placeholder="HH:MM" keyboardType="numeric" />
        </FieldRow>
        <FieldRow label="IFR Actual">
          <TextField value={ifrActual} onChangeText={setIfrActual} placeholder="HH:MM" keyboardType="numeric" />
        </FieldRow>
        <FieldRow label="X-C Total">
          <TextField value={crossCountryTotal} onChangeText={setCrossCountryTotal} placeholder="HH:MM" keyboardType="numeric" />
        </FieldRow>
        <FieldRow label="Instrument">
          <TextField value={instrumentTimings} onChangeText={setInstrumentTimings} placeholder="HH:MM" keyboardType="numeric" />
        </FieldRow>
        <FieldRow label="IFR Sim">
          <TextField value={ifrSimulated} onChangeText={setIfrSimulated} placeholder="HH:MM" keyboardType="numeric" />
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

        <View className="mb-5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
          {[
            ['Cross country flight', isCrossCountry, setIsCrossCountry],
            ['PF (actual T/O + LDG)', pfTakeoffLanding, setPfTakeoffLanding],
            ['STL (Co-pilot only)', stl, setStl],
            ['Multi crew', multiCrew, setMultiCrew],
            ['ULR ops', ulrOps, setUlrOps],
          ].map(([label, value, setter]) => (
            <View key={label as string} className="mb-2 flex-row items-center justify-between last:mb-0">
              <Text className="text-sm font-medium text-slate-200">{label as string}</Text>
              <Switch
                value={value as boolean}
                onValueChange={setter as (v: boolean) => void}
                trackColor={{ false: '#475569', true: '#2563eb' }}
              />
            </View>
          ))}
        </View>

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

      <Modal visible={capacityOpen} transparent animationType="slide" onRequestClose={() => setCapacityOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[70%] rounded-t-2xl bg-slate-900 px-4 pb-6 pt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">Operating Capacity</Text>
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
                  className="flex-row items-center justify-between border-b border-slate-800 py-4">
                  <Text className="text-base text-slate-100">{option.label}</Text>
                  {option.value === operatingCapacity ? <FontAwesome name="check" size={14} color="#60a5fa" /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
