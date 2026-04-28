import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_CAPACITY_OPTIONS,
  DefaultCapacity,
  LICENSE_TYPE_OPTIONS,
  LicenseType,
  RANK_OPTIONS,
  Rank,
  getProfile,
  toLabel,
  upsertProfile,
} from '@/utils/profile';
import { useSupabaseSession } from '@/utils/auth';

type SelectFieldProps = {
  label: string;
  value: string | null;
  options: readonly { label: string; value: string }[];
  onSelect: (value: string) => void;
};

function SelectField({ label, value, options, onSelect }: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-slate-300">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
        <Text className={`text-base ${value ? 'text-white' : 'text-slate-500'}`}>
          {toLabel(value, options)}
        </Text>
        <FontAwesome name="chevron-down" size={13} color="#94a3b8" />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[70%] rounded-t-2xl bg-slate-900 px-4 pb-6 pt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">{label}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text className="text-sm font-semibold text-blue-400">Close</Text>
              </Pressable>
            </View>
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-slate-800 py-4">
                  <Text className="text-base text-slate-100">{option.label}</Text>
                  {option.value === value ? <FontAwesome name="check" size={14} color="#60a5fa" /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function ProfileEditScreen() {
  const { session } = useSupabaseSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [country, setCountry] = useState('');
  const [rank, setRank] = useState<Rank | null>(null);
  const [defaultOperatingCapacity, setDefaultOperatingCapacity] = useState<DefaultCapacity | null>(null);
  const [licenseType, setLicenseType] = useState<LicenseType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await getProfile(userId);
      if (fetchError) {
        if (mounted) {
          setError(fetchError.message);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setName(data?.full_name || (session?.user?.user_metadata?.full_name as string) || '');
        setOrganization(data?.organization || '');
        setLicenseNumber(data?.license_number || '');
        setCountry(data?.country || '');
        setRank(data?.rank || null);
        setDefaultOperatingCapacity(data?.default_operating_capacity || null);
        setLicenseType(data?.license_type || null);
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id, session?.user?.user_metadata?.full_name]);

  const email = useMemo(() => session?.user?.email || null, [session?.user?.email]);

  const saveProfile = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setError('No active Supabase session found. Please login again.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: saveError } = await upsertProfile({
      user_id: userId,
      email,
      full_name: name.trim() || null,
      rank,
      default_operating_capacity: defaultOperatingCapacity,
      organization: organization.trim() || null,
      license_type: licenseType,
      license_number: licenseNumber.trim() || null,
      country: country.trim() || null,
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    router.replace('/profile');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <FontAwesome name="angle-left" size={18} color="#e2e8f0" />
            </Pressable>
            <Text className="text-2xl font-bold text-white">Edit Profile</Text>
          </View>
          <Pressable onPress={() => router.back()} className="rounded-xl bg-slate-800 px-3 py-2 active:bg-slate-700">
            <Text className="text-sm font-semibold text-slate-100">Cancel</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#93c5fd" />
          </View>
        ) : (
          <View>
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-slate-300">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
              />
            </View>

            <SelectField
              label="Rank"
              value={rank}
              options={RANK_OPTIONS}
              onSelect={(value) => setRank(value as Rank)}
            />

            <SelectField
              label="Default Operating Capacity"
              value={defaultOperatingCapacity}
              options={DEFAULT_CAPACITY_OPTIONS}
              onSelect={(value) => setDefaultOperatingCapacity(value as DefaultCapacity)}
            />

            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-slate-300">Airline / GA / Flight School</Text>
              <TextInput
                value={organization}
                onChangeText={setOrganization}
                placeholder="Enter organization"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
              />
            </View>

            <SelectField
              label="License Type"
              value={licenseType}
              options={LICENSE_TYPE_OPTIONS}
              onSelect={(value) => setLicenseType(value as LicenseType)}
            />

            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-slate-300">License Number</Text>
              <TextInput
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Enter alphanumeric license number"
                placeholderTextColor="#64748b"
                autoCapitalize="characters"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
              />
            </View>

            <View className="mb-2">
              <Text className="mb-2 text-sm font-semibold text-slate-300">Country</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Enter country"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
              />
            </View>

            {error ? <Text className="mt-3 text-sm text-red-400">{error}</Text> : null}

            <Pressable
              onPress={saveProfile}
              disabled={saving}
              className="mt-6 items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-60">
              <Text className="text-base font-semibold text-white">
                {saving ? 'Saving...' : 'Update Profile'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
