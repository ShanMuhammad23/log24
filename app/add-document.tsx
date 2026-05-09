import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import { createPilotDocument } from '@/utils/documents';
import { supabase } from '@/utils/supabase';

function formatDateISO(dateValue: Date) {
  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, '0');
  const d = String(dateValue.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AddDocumentScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderDays, setReminderDays] = useState('15');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  const onDateChange = (
    picker: 'issue' | 'expiry',
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (picker === 'issue') setShowIssuePicker(false);
    if (picker === 'expiry') setShowExpiryPicker(false);
    if (!selectedDate) return;

    const formatted = formatDateISO(selectedDate);
    if (picker === 'issue') setIssueDate(formatted);
    if (picker === 'expiry') setExpiryDate(formatted);
  };

  const saveDocument = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setError('You are not logged in. Please login again.');
      return;
    }
    if (!documentType.trim() || !documentName.trim()) {
      setError('Document type and document name are required.');
      return;
    }

    const reminder = Number(reminderDays);
    if (Number.isNaN(reminder) || reminder < 0 || reminder > 365) {
      setError('Reminder days must be between 0 and 365.');
      return;
    }

    setSaving(true);
    setError(null);

    let uploadedPath: string | null = null;
    if (selectedFile) {
      const ext = selectedFile.name.includes('.') ? selectedFile.name.split('.').pop() : 'bin';
      const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const fileResponse = await fetch(selectedFile.uri);
      const fileArrayBuffer = await fileResponse.arrayBuffer();
      const { error: uploadError } = await supabase.storage.from('pilot-documents').upload(storagePath, fileArrayBuffer, {
        contentType: selectedFile.mimeType || 'application/octet-stream',
        upsert: false,
      });

      if (uploadError) {
        setSaving(false);
        setError(
          `File upload failed: ${uploadError.message}. Ensure storage bucket "pilot-documents" exists and is writable.`
        );
        return;
      }
      uploadedPath = storagePath;
    }

    const { error: insertError } = await createPilotDocument({
      user_id: userId,
      document_type: documentType.trim(),
      document_name: documentName.trim(),
      issuer: issuer.trim() || null,
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      reminder_days_before: reminder,
      file_name: selectedFile?.name || null,
      file_path: uploadedPath,
      mime_type: selectedFile?.mimeType || null,
      size_bytes: selectedFile?.size || null,
      notes: notes.trim() || null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.replace('/(tabs)/documents');
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/png', 'image/jpeg'],
    });
    if (result.canceled) return;
    setSelectedFile(result.assets[0] || null);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-200">
            <FontAwesome name="angle-left" size={18} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">Add Document</Text>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700">Document Type *</Text>
          <TextInput
            value={documentType}
            onChangeText={setDocumentType}
            placeholder="e.g. Passport, Class 2 Medical"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700">Document Name *</Text>
          <TextInput
            value={documentName}
            onChangeText={setDocumentName}
            placeholder="Enter document name"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700">Issuer</Text>
          <TextInput
            value={issuer}
            onChangeText={setIssuer}
            placeholder="Issuing authority"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
          />
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-semibold text-slate-700">Issue Date</Text>
            <Pressable
              onPress={() => setShowIssuePicker(true)}
              className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3">
              <Text className={issueDate ? 'text-slate-900' : 'text-slate-500'}>{issueDate || 'YYYY-MM-DD'}</Text>
              <FontAwesome name="calendar" size={15} color="#64748b" />
            </Pressable>
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-semibold text-slate-700">Expiry Date</Text>
            <Pressable
              onPress={() => setShowExpiryPicker(true)}
              className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3">
              <Text className={expiryDate ? 'text-slate-900' : 'text-slate-500'}>{expiryDate || 'YYYY-MM-DD'}</Text>
              <FontAwesome name="calendar" size={15} color="#64748b" />
            </Pressable>
          </View>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700">Reminder Days Before Expiry</Text>
          <TextInput
            value={reminderDays}
            onChangeText={setReminderDays}
            keyboardType="numeric"
            placeholder="15"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700">Document File</Text>
          <Pressable
            onPress={pickFile}
            className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3">
            <Text className="text-base font-medium text-blue-700">{selectedFile ? 'Change File' : 'Choose File'}</Text>
            <Text className="mt-1 text-sm text-slate-500">PDF, PNG, JPG. File details auto-filled.</Text>
          </Pressable>
          {selectedFile ? (
            <View className="mt-2 rounded-xl bg-slate-100 px-3 py-2">
              <Text className="text-sm font-medium text-slate-700">{selectedFile.name}</Text>
              <Text className="text-xs text-slate-500">
                {selectedFile.mimeType || 'application/octet-stream'} • {selectedFile.size || 0} bytes
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mb-2">
          <Text className="mb-2 text-sm font-semibold text-slate-700">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
          />
        </View>

        {error ? <Text className="mt-3 text-sm text-red-500">{error}</Text> : null}

        <Pressable
          onPress={saveDocument}
          disabled={saving}
          className="mt-6 items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-60">
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text className="text-base font-semibold text-white">Save Document</Text>}
        </Pressable>
      </ScrollView>

      {showIssuePicker ? (
        <DateTimePicker
          value={issueDate ? new Date(`${issueDate}T00:00:00`) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selected) => onDateChange('issue', event, selected)}
        />
      ) : null}
      {showExpiryPicker ? (
        <DateTimePicker
          value={expiryDate ? new Date(`${expiryDate}T00:00:00`) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selected) => onDateChange('expiry', event, selected)}
        />
      ) : null}
    </SafeAreaView>
  );
}
