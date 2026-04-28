import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DEFAULT_CAPACITY_OPTIONS } from '@/utils/profile';
import { useSupabaseSession } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

function toMinutes(value: string) {
  const [h, m] = value.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDateISO(dateValue: Date) {
  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, '0');
  const d = String(dateValue.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeHHMM(dateValue: Date) {
  const h = String(dateValue.getHours()).padStart(2, '0');
  const m = String(dateValue.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function AddFlightScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [date, setDate] = useState('');
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
  const [attachments, setAttachments] = useState('');
  const [signature, setSignature] = useState('');
  const [instrumentTimings, setInstrumentTimings] = useState('');
  const [ifrSimulated, setIfrSimulated] = useState('');
  const [operatingCapacity, setOperatingCapacity] = useState<string | null>(null);
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [outTime, setOutTime] = useState('');
  const [inTime, setInTime] = useState('');
  const [isCrossCountry, setIsCrossCountry] = useState(false);
  const [pfTakeoffLanding, setPfTakeoffLanding] = useState(false);
  const [stl, setStl] = useState(false);
  const [multiCrew, setMultiCrew] = useState(false);
  const [ulrOps, setUlrOps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOutPicker, setShowOutPicker] = useState(false);
  const [showInPicker, setShowInPicker] = useState(false);
  const [showNightPicker, setShowNightPicker] = useState(false);
  const [showIfrActualPicker, setShowIfrActualPicker] = useState(false);
  const [showCrossCountryPicker, setShowCrossCountryPicker] = useState(false);
  const [showInstrumentPicker, setShowInstrumentPicker] = useState(false);
  const [showIfrSimulatedPicker, setShowIfrSimulatedPicker] = useState(false);

  const totalTime = useMemo(() => {
    const out = toMinutes(outTime);
    const input = toMinutes(inTime);
    if (out === null || input === null) return '--:--';
    const diff = input >= out ? input - out : 24 * 60 - out + input;
    return formatDuration(diff);
  }, [outTime, inTime]);

  const baseFields: Array<[string, string]> = [
    ['Flight No.', 'e.g. AI302'],
    ['Registration *', 'e.g. VT-ABC'],
    ['A/c Type *', 'e.g. A320'],
    ['From *', 'Departure'],
    ['To *', 'Arrival'],
  ];

  const otherFields: Array<[string, string]> = [
    ['PIC Name', 'Pilot in command'],
    ['Co Pilot Name', 'Co-pilot'],
    ['Route (Overfly points)', 'VOR / waypoints'],
    ['Distance', 'NM'],
    ['Remarks', 'Any notes'],
    ['Attachments', 'Attachment URL or reference'],
    ['Signature', 'Signature reference'],
  ];

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(formatDateISO(selectedDate));
  };

  const handleTimeChange = (
    setter: (v: string) => void,
    toggleSetter: (v: boolean) => void,
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    toggleSetter(false);
    if (selectedDate) setter(formatTimeHHMM(selectedDate));
  };

  const saveFlight = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setError('You are not logged in. Please login again.');
      return;
    }

    if (!date.trim() || !registration.trim() || !aircraftType.trim() || !from.trim() || !to.trim() || !operatingCapacity) {
      setError('Please fill all required fields (*) before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const blockMinutes = (() => {
      const out = toMinutes(outTime);
      const input = toMinutes(inTime);
      if (out === null || input === null) return null;
      return input >= out ? input - out : 24 * 60 - out + input;
    })();

    const nightMinutes = toMinutes(night);
    const instrumentMinutes = toMinutes(instrumentTimings);

    const payload: Record<string, unknown> = {
      user_id: userId,
      flight_date: date.trim(),
      flight_number: flightNo.trim() || null,
      aircraft_type: aircraftType.trim(),
      aircraft_registration: registration.trim(),
      origin_iata: from.trim().toUpperCase(),
      destination_iata: to.trim().toUpperCase(),
      block_time_minutes: blockMinutes,
      night_time_minutes: nightMinutes,
      instrument_time_minutes: instrumentMinutes,
      remarks: remarks.trim() || null,
    };

    const { error: insertError } = await supabase.from('flights').insert(payload);
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess('Flight saved successfully.');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#e2e8f0" />
          </Pressable>
          <Text className="text-2xl font-bold text-white">Add Flight</Text>
        </View>

        <View className="mb-3 flex-row items-center gap-3">
          <Text className="w-36 text-sm font-semibold text-slate-300">Date *</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="flex-1 flex-row items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
            <Text className={`text-base ${date ? 'text-white' : 'text-slate-500'}`}>{date || 'YYYY-MM-DD'}</Text>
            <FontAwesome name="calendar" size={15} color="#94a3b8" />
          </Pressable>
        </View>

        {baseFields.map(([label, placeholder]) => (
          <View key={label} className="mb-3 flex-row items-center gap-3">
            <Text className="w-36 text-sm font-semibold text-slate-300">{label}</Text>
            <TextInput
              value={
                label === 'Date *'
                  ? date
                  : label === 'Flight No.'
                  ? flightNo
                  : label === 'Registration *'
                  ? registration
                  : label === 'A/c Type *'
                  ? aircraftType
                  : label === 'From *'
                  ? from
                  : to
              }
              onChangeText={
                label === 'Date *'
                  ? setDate
                  : label === 'Flight No.'
                  ? setFlightNo
                  : label === 'Registration *'
                  ? setRegistration
                  : label === 'A/c Type *'
                  ? setAircraftType
                  : label === 'From *'
                  ? setFrom
                  : setTo
              }
              placeholder={placeholder}
              placeholderTextColor="#64748b"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
            />
          </View>
        ))}

        <View className="mb-3 flex-row items-center gap-3">
          <Text className="w-36 text-sm font-semibold text-slate-300">Operating Capacity *</Text>
          <Pressable
            onPress={() => setCapacityOpen(true)}
            className="flex-1 flex-row items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
            <Text className={`text-base ${operatingCapacity ? 'text-white' : 'text-slate-500'}`}>
              {DEFAULT_CAPACITY_OPTIONS.find((c) => c.value === operatingCapacity)?.label || 'Select operating capacity'}
            </Text>
            <FontAwesome name="chevron-down" size={13} color="#94a3b8" />
          </Pressable>
        </View>

        {[
          ['Out Time', outTime, setOutTime, setShowOutPicker],
          ['In Time', inTime, setInTime, setShowInPicker],
          ['Night', night, setNight, setShowNightPicker],
          ['IFR Actual', ifrActual, setIfrActual, setShowIfrActualPicker],
          ['Cross country Total', crossCountryTotal, setCrossCountryTotal, setShowCrossCountryPicker],
          ['Instrument Timings', instrumentTimings, setInstrumentTimings, setShowInstrumentPicker],
          ['IFR Simulated', ifrSimulated, setIfrSimulated, setShowIfrSimulatedPicker],
        ].map(([label, value, setter, toggle]) => (
          <View key={label as string} className="mb-3 flex-row items-center gap-3">
            <Text className="w-36 text-sm font-semibold text-slate-300">{label as string}</Text>
            <Pressable
              onPress={() => (toggle as (v: boolean) => void)(true)}
              className="flex-1 flex-row items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
              <Text className={`text-base ${(value as string) ? 'text-white' : 'text-slate-500'}`}>
                {(value as string) || 'HH:MM'}
              </Text>
              <FontAwesome name="clock-o" size={14} color="#94a3b8" />
            </Pressable>
          </View>
        ))}

        {otherFields.map(([label, placeholder]) => (
          <View key={label} className="mb-3 flex-row items-center gap-3">
            <Text className="w-36 text-sm font-semibold text-slate-300">{label}</Text>
            <TextInput
              value={
                label === 'Out Time'
                  ? outTime
                  : label === 'In Time'
                  ? inTime
                  : label === 'PIC Name'
                  ? picName
                  : label === 'Co Pilot Name'
                  ? coPilotName
                  : label === 'Route (Overfly points)'
                  ? routePoints
                  : label === 'Distance'
                  ? distance
                  : label === 'Remarks'
                  ? remarks
                  : label === 'Attachments'
                  ? attachments
                  : label === 'Signature'
                  ? signature
                  : ''
              }
              onChangeText={
                label === 'Out Time'
                  ? setOutTime
                  : label === 'In Time'
                  ? setInTime
                  : label === 'PIC Name'
                  ? setPicName
                  : label === 'Co Pilot Name'
                  ? setCoPilotName
                  : label === 'Route (Overfly points)'
                  ? setRoutePoints
                  : label === 'Distance'
                  ? setDistance
                  : label === 'Remarks'
                  ? setRemarks
                  : label === 'Attachments'
                  ? setAttachments
                  : label === 'Signature'
                  ? setSignature
                  : setRemarks
              }
              placeholder={placeholder}
              placeholderTextColor="#64748b"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
            />
          </View>
        ))}

        <View className="mb-4 flex-row items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
          <Text className="w-36 text-sm font-semibold text-slate-300">Total Time (auto)</Text>
          <Text className="text-lg font-bold text-blue-300">{totalTime}</Text>
        </View>

        <View className="mb-5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
          {[
            ['Is cross Country', isCrossCountry, setIsCrossCountry],
            ['PF (actual T/O + LDG)', pfTakeoffLanding, setPfTakeoffLanding],
            ['STL (Co-pilot only)', stl, setStl],
            ['Multi Crew', multiCrew, setMultiCrew],
            ['ULR Ops', ulrOps, setUlrOps],
          ].map(([label, value, setter]) => (
            <View key={label as string} className="mb-2 flex-row items-center justify-between last:mb-0">
              <Text className="text-sm font-medium text-slate-200">{label as string}</Text>
              <Switch
                value={value as boolean}
                onValueChange={setter as (value: boolean) => void}
                trackColor={{ false: '#475569', true: '#2563eb' }}
              />
            </View>
          ))}
        </View>

        {error ? <Text className="mb-3 text-sm text-red-400">{error}</Text> : null}
        {success ? <Text className="mb-3 text-sm text-emerald-400">{success}</Text> : null}

        <Pressable
          onPress={saveFlight}
          disabled={saving}
          className="items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-60">
          <Text className="text-base font-semibold text-white">{saving ? 'Saving...' : 'Save Flight'}</Text>
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

      {showDatePicker ? (
        <DateTimePicker
          value={date ? new Date(`${date}T00:00:00`) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      ) : null}
      {showOutPicker ? (
        <DateTimePicker
          value={outTime ? new Date(`2000-01-01T${outTime}:00`) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selected) => handleTimeChange(setOutTime, setShowOutPicker, event, selected)}
        />
      ) : null}
      {showInPicker ? (
        <DateTimePicker
          value={inTime ? new Date(`2000-01-01T${inTime}:00`) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selected) => handleTimeChange(setInTime, setShowInPicker, event, selected)}
        />
      ) : null}
      {showNightPicker ? (
        <DateTimePicker
          value={night ? new Date(`2000-01-01T${night}:00`) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selected) => handleTimeChange(setNight, setShowNightPicker, event, selected)}
        />
      ) : null}
      {showIfrActualPicker ? (
        <DateTimePicker
          value={ifrActual ? new Date(`2000-01-01T${ifrActual}:00`) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selected) => handleTimeChange(setIfrActual, setShowIfrActualPicker, event, selected)}
        />
      ) : null}
      {showCrossCountryPicker ? (
        <DateTimePicker
          value={crossCountryTotal ? new Date(`2000-01-01T${crossCountryTotal}:00`) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selected) =>
            handleTimeChange(setCrossCountryTotal, setShowCrossCountryPicker, event, selected)
          }
        />
      ) : null}
      {showInstrumentPicker ? (
        <DateTimePicker
          value={instrumentTimings ? new Date(`2000-01-01T${instrumentTimings}:00`) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selected) =>
            handleTimeChange(setInstrumentTimings, setShowInstrumentPicker, event, selected)
          }
        />
      ) : null}
      {showIfrSimulatedPicker ? (
        <DateTimePicker
          value={ifrSimulated ? new Date(`2000-01-01T${ifrSimulated}:00`) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selected) =>
            handleTimeChange(setIfrSimulated, setShowIfrSimulatedPicker, event, selected)
          }
        />
      ) : null}
    </SafeAreaView>
  );
}
