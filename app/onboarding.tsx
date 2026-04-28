import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import { RANK_OPTIONS, Rank, upsertProfile, toLabel } from '@/utils/profile';

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
        <Text className={`text-base ${value ? 'text-white' : 'text-slate-500'}`}>{toLabel(value, options)}</Text>
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

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, loading } = useSupabaseSession();
  const [name, setName] = useState('');
  const [rank, setRank] = useState<Rank | null>(null);
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-6 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#e2e8f0" />
          </Pressable>
          <Text className="text-2xl font-bold text-white">Complete Profile</Text>
        </View>

        <Text className="mb-5 text-sm text-slate-400">
          Set these details to continue. Name, Rank, and Current Airline are required.
        </Text>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-300">Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
          />
        </View>

        <SelectField label="Rank *" value={rank} options={RANK_OPTIONS} onSelect={(value) => setRank(value as Rank)} />

        <View className="mb-2">
          <Text className="mb-2 text-sm font-semibold text-slate-300">Current Airline / GA / Flight School *</Text>
          <TextInput
            value={organization}
            onChangeText={setOrganization}
            placeholder="Enter current airline"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
          />
        </View>

        {error ? <Text className="mt-4 text-sm text-red-400">{error}</Text> : null}

        <Pressable
          onPress={completeOnboarding}
          disabled={saving}
          className="mt-6 items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-60">
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text className="text-base font-semibold text-white">Continue</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
