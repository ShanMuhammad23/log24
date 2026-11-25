import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrganizationAutocompleteField } from '@/components/profile/OrganizationAutocompleteField';
import { INK, MIST, NIGHT, SUB } from '@/constants/Colors';
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
  const isDark = useColorScheme() === 'dark';
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-lg border border-rule bg-white px-4 py-3 dark:border-ruleDark dark:bg-panel">
        <Text className={`text-base ${value ? 'text-ink dark:text-white' : 'text-sub dark:text-mist'}`}>
          {toLabel(value, options)}
        </Text>
        <FontAwesome name="chevron-down" size={13} color={isDark ? MIST : SUB} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[70%] rounded-t-xl border-t border-rule bg-white px-4 pb-6 pt-4 dark:border-ruleDark dark:bg-panel">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-ink dark:text-white">{label}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text className="text-sm font-semibold text-arcDeep dark:text-arc">Close</Text>
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
                  className="flex-row items-center justify-between border-b border-rule py-4 dark:border-ruleDark">
                  <Text className="text-base text-ink dark:text-white">{option.label}</Text>
                  {option.value === value ? <FontAwesome name="check" size={14} color="#2EA8FF" /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProfileEditSkeleton() {
  return (
    <View>
      {[1, 2, 3, 4, 5, 6, 7].map((id) => (
        <View key={id} className="mb-4">
          <View className="mb-2 h-3 w-40 rounded bg-rule dark:bg-ruleDark" />
          <View className="h-12 rounded-lg bg-rule dark:bg-panel" />
        </View>
      ))}
      <View className="mb-3 h-5 w-52 rounded bg-rule dark:bg-panel" />
      <View className="mt-3 h-12 rounded-lg bg-rule dark:bg-panel" />
    </View>
  );
}

export default function ProfileEditScreen() {
  const { session } = useSupabaseSession();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

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

  const inputClass =
    'rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white';
  const labelClass = 'mb-2 text-sm font-medium text-sub dark:text-mist';
  const placeholderColor = isDark ? MIST : SUB;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper dark:bg-night">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
              <FontAwesome name="angle-left" size={18} color={isDark ? MIST : INK} />
            </Pressable>
            <Text className="text-2xl font-bold text-ink dark:text-white">Edit profile</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="rounded-lg border border-rule px-3 py-2 active:bg-paper dark:border-ruleDark dark:active:bg-panel">
            <Text className="text-sm font-semibold text-ink dark:text-white">Cancel</Text>
          </Pressable>
        </View>

        {loading ? (
          <ProfileEditSkeleton />
        ) : (
          <View>
            <View className="mb-4">
              <Text className={labelClass}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor={placeholderColor}
                className={inputClass}
              />
            </View>

            <SelectField
              label="Rank"
              value={rank}
              options={RANK_OPTIONS}
              onSelect={(value) => setRank(value as Rank)}
            />

            <SelectField
              label="Default operating capacity"
              value={defaultOperatingCapacity}
              options={DEFAULT_CAPACITY_OPTIONS}
              onSelect={(value) => setDefaultOperatingCapacity(value as DefaultCapacity)}
            />

            <OrganizationAutocompleteField
              label="Airline / GA / flight school"
              value={organization}
              onChange={setOrganization}
              placeholder="Type to search organizations"
            />

            <SelectField
              label="License type"
              value={licenseType}
              options={LICENSE_TYPE_OPTIONS}
              onSelect={(value) => setLicenseType(value as LicenseType)}
            />

            <View className="mb-4">
              <Text className={labelClass}>License number</Text>
              <TextInput
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Enter alphanumeric license number"
                placeholderTextColor={placeholderColor}
                autoCapitalize="characters"
                className={inputClass}
              />
            </View>

            <View className="mb-2">
              <Text className={labelClass}>Country</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Enter country"
                placeholderTextColor={placeholderColor}
                className={inputClass}
              />
            </View>

            {error ? <Text className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

            <Pressable
              onPress={saveProfile}
              disabled={saving}
              className="mt-6 items-center rounded-lg bg-arc py-3.5 active:opacity-90 disabled:opacity-60">
              <Text className="text-base font-semibold text-night">
                {saving ? 'Saving…' : 'Update profile'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
