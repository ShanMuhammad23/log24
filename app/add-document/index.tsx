import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentDateField } from '@/components/documents/DocumentDateField';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INK, MIST, NIGHT, SUB } from '@/constants/Colors';
import { useSupabaseSession } from '@/utils/auth';
import { stageDocsReturnPreview } from '@/utils/docs-navigation';
import {
  createPilotDocument,
  fetchPilotDocumentById,
  formatDocumentFileSize,
  updatePilotDocument,
} from '@/utils/documents';
import { syncDocumentExpiryNotifications } from '@/utils/document-notifications';
import { supabase } from '@/utils/supabase';

export default function AddDocumentScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(editId);
  const { session } = useSupabaseSession();
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderDays, setReminderDays] = useState('15');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [existingFilePath, setExistingFilePath] = useState<string | null>(null);
  const [fileRemoved, setFileRemoved] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!editId || !session?.user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data, error: loadError } = await fetchPilotDocumentById(session.user.id, editId);
      if (cancelled) return;

      if (loadError || !data) {
        setError(loadError?.message || 'Document not found.');
        setLoading(false);
        return;
      }

      setDocumentType(data.document_type);
      setDocumentName(data.document_name);
      setIssuer(data.issuer || '');
      setIssueDate(data.issue_date || '');
      setExpiryDate(data.expiry_date || '');
      setReminderDays(String(data.reminder_days_before ?? 15));
      setNotes(data.notes || '');
      setExistingFileName(data.file_name);
      setExistingFilePath(data.file_path);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [editId, session?.user?.id]);

  const uploadFile = async (userId: string) => {
    if (!selectedFile) return { path: null as string | null, error: null as string | null };

    const ext = selectedFile.name.includes('.') ? selectedFile.name.split('.').pop() : 'bin';
    const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const fileResponse = await fetch(selectedFile.uri);
    const fileArrayBuffer = await fileResponse.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from('pilot-documents').upload(storagePath, fileArrayBuffer, {
      contentType: selectedFile.mimeType || 'application/octet-stream',
      upsert: false,
    });

    if (uploadError) {
      return {
        path: null,
        error: `File upload failed: ${uploadError.message}. Ensure storage bucket "pilot-documents" exists and is writable.`,
      };
    }

    return { path: storagePath, error: null };
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

    let filePath: string | null = fileRemoved ? null : existingFilePath;
    let fileName: string | null = fileRemoved ? null : existingFileName;
    let mimeType: string | null = null;
    let sizeBytes: number | null = null;

    if (selectedFile) {
      const { path, error: uploadError } = await uploadFile(userId);
      if (uploadError) {
        setSaving(false);
        setError(uploadError);
        return;
      }
      if (isEditing && existingFilePath && existingFilePath !== path) {
        await supabase.storage.from('pilot-documents').remove([existingFilePath]);
      }
      filePath = path;
      fileName = selectedFile.name;
      mimeType = selectedFile.mimeType || null;
      sizeBytes = selectedFile.size || null;
    } else if (fileRemoved && existingFilePath) {
      await supabase.storage.from('pilot-documents').remove([existingFilePath]);
    }

    const basePayload = {
      document_type: documentType.trim(),
      document_name: documentName.trim(),
      issuer: issuer.trim() || null,
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      reminder_days_before: reminder,
      notes: notes.trim() || null,
    };

    const fileChanged = Boolean(selectedFile) || fileRemoved;

    if (isEditing && editId) {
      const { error: updateError } = await updatePilotDocument(userId, editId, {
        ...basePayload,
        ...(fileChanged
          ? { file_name: fileName, file_path: filePath, mime_type: mimeType, size_bytes: sizeBytes }
          : {}),
      });
      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await createPilotDocument({
        user_id: userId,
        ...basePayload,
        file_name: fileName,
        file_path: filePath,
        mime_type: mimeType,
        size_bytes: sizeBytes,
      });
      setSaving(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }

      stageDocsReturnPreview({
        user_id: userId,
        document_type: basePayload.document_type,
        document_name: basePayload.document_name,
        expiry_date: basePayload.expiry_date,
        issue_date: basePayload.issue_date,
        reminder_days_before: reminder,
      });
    }

    await syncDocumentExpiryNotifications(userId);
    router.back();
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/png', 'image/jpeg'],
    });
    if (result.canceled) return;
    setSelectedFile(result.assets[0] || null);
    setFileRemoved(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (existingFileName || existingFilePath) {
      setFileRemoved(true);
    }
    setExistingFileName(null);
    setExistingFilePath(null);
  };

  const displayFileName = selectedFile?.name || (!fileRemoved ? existingFileName : null);

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 items-center justify-center bg-paper dark:bg-night">
        <ActivityIndicator size="large" color="#2EA8FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-paper dark:bg-night">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
            <FontAwesome name="angle-left" size={18} color={isDark ? MIST : INK} />
          </Pressable>
          <Text className="text-2xl font-bold text-ink dark:text-white">
            {isEditing ? 'Edit document' : 'Add document'}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">Document type *</Text>
          <TextInput
            value={documentType}
            onChangeText={setDocumentType}
            placeholder="e.g. Passport, Class 2 Medical"
            placeholderTextColor={isDark ? MIST : SUB}
            className="rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">Document name *</Text>
          <TextInput
            value={documentName}
            onChangeText={setDocumentName}
            placeholder="Enter document name"
            placeholderTextColor={isDark ? MIST : SUB}
            className="rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">Issuer</Text>
          <TextInput
            value={issuer}
            onChangeText={setIssuer}
            placeholder="Issuing authority"
            placeholderTextColor={isDark ? MIST : SUB}
            className="rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
          />
        </View>

        <View className="mb-4 flex-row gap-3">
          <DocumentDateField label="Issue date" value={issueDate} onChange={setIssueDate} />
          <DocumentDateField label="Expiry date" value={expiryDate} onChange={setExpiryDate} />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">Reminder days before expiry</Text>
          <TextInput
            value={reminderDays}
            onChangeText={setReminderDays}
            keyboardType="numeric"
            placeholder="15"
            placeholderTextColor={isDark ? MIST : SUB}
            className="rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">Document file</Text>
          <Pressable
            onPress={pickFile}
            className="rounded-lg border border-dashed border-rule bg-white px-4 py-3 dark:border-ruleDark dark:bg-panel">
            <Text className="text-base font-medium text-arcDeep dark:text-arc">
              {displayFileName ? 'Change file' : 'Choose file'}
            </Text>
            <Text className="mt-1 text-sm text-sub dark:text-mist">PDF, PNG, JPG. File details auto-filled.</Text>
          </Pressable>
          {displayFileName ? (
            <View className="mt-2 flex-row items-center justify-between rounded-lg bg-paper px-3 py-2 dark:bg-panel">
              <View className="mr-2 flex-1">
                <Text className="text-sm font-medium text-ink dark:text-white">{displayFileName}</Text>
                {selectedFile ? (
                  <Text className="text-xs text-sub dark:text-mist">
                    {selectedFile.mimeType || 'application/octet-stream'} • {formatDocumentFileSize(selectedFile.size)}
                  </Text>
                ) : (
                  <Text className="text-xs text-sub dark:text-mist">Current file on record</Text>
                )}
              </View>
              <Pressable onPress={clearFile} hitSlop={8}>
                <FontAwesome name="times-circle" size={20} color={isDark ? MIST : INK} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View className="mb-2">
          <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes"
            placeholderTextColor={isDark ? MIST : SUB}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
          />
        </View>

        {error ? <Text className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <Pressable
          onPress={saveDocument}
          disabled={saving}
          className="mt-6 items-center rounded-lg bg-arc py-3.5 active:opacity-90 disabled:opacity-60">
          {saving ? (
            <ActivityIndicator color={NIGHT} />
          ) : (
            <Text className="text-base font-semibold text-night">{isEditing ? 'Update document' : 'Save document'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
