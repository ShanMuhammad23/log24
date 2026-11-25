import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INK, MIST, SUB } from '@/constants/Colors';
import { useSupabaseSession } from '@/utils/auth';
import { OrganizationAutocompleteField } from '@/components/profile/OrganizationAutocompleteField';
import { RANK_OPTIONS, Rank, upsertProfile, toLabel } from '@/utils/profile';

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
        className="flex-row items-center justify-between rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel px-4 py-3">
        <Text className={`text-base ${value ? 'text-ink dark:text-white' : 'text-sub dark:text-mist'}`}>{toLabel(value, options)}</Text>
        <FontAwesome name="chevron-down" size={13} color={isDark ? MIST : SUB} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[70%] rounded-t-xl border-t border-rule bg-white dark:border-ruleDark dark:bg-panel px-4 pb-6 pt-4">
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

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, loading } = useSupabaseSession();
  const [name, setName] = useState('');
  const [rank, setRank] = useState<Rank | null>(null);
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = useColorScheme() === 'dark';

  const email = useMemo(() => session?.user?.email || null, [session?.user?.email]);

  if (!loading && !session) {
    return <Redirect href="/login" />;
  }

  const completeOnboarding = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    if (!name.trim() || !rank || !organization.trim()) {
      setError('Name, Rank, and Current Airline are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: saveError } = await upsertProfile({
      user_id: userId,
      email,
      full_name: name.trim(),
      rank,
      organization: organization.trim(),
      onboarding_shown: true,
      default_operating_capacity: null,
      license_type: null,
      license_number: null,
      country: null,
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-paper dark:bg-night">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-6 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
            <FontAwesome name="angle-left" size={18} color={isDark ? MIST : INK} />
          </Pressable>
          <Text className="text-2xl font-bold text-ink dark:text-white">Complete Profile</Text>
        </View>

        <Text className="mb-5 text-sm text-sub dark:text-mist">
          Set these details to continue. Name, Rank, and Current Airline are required.
        </Text>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            placeholderTextColor={isDark ? MIST : SUB}
            className="rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel px-4 py-3 text-base text-ink dark:text-white"
          />
        </View>

        <SelectField label="Rank *" value={rank} options={RANK_OPTIONS} onSelect={(value) => setRank(value as Rank)} />

        <OrganizationAutocompleteField
          label="Current Airline / GA / Flight School *"
          value={organization}
          onChange={setOrganization}
          placeholder="Type to search organizations"
        />

        {error ? <Text className="mt-4 text-sm text-red-400">{error}</Text> : null}

        <Pressable
          onPress={completeOnboarding}
          disabled={saving}
          className="mt-6 items-center rounded-lg bg-arc py-3.5 active:opacity-90 disabled:opacity-60">
          {saving ? <ActivityIndicator color="#0A1428" /> : <Text className="text-base font-semibold text-night">Continue</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
