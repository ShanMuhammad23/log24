import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentDateField } from '@/components/documents/DocumentDateField';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import { stageDocsReturnPreview } from '@/utils/docs-navigation';
import {
  createPilotDocument,
  fetchPilotDocumentById,
  formatDocumentFileSize,
  updatePilotDocument,
} from '@/utils/documents';
import { supabase } from '@/utils/supabase';

export default function AddDocumentScreen() {
  const router = useRouter();
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
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#94a3b8" />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Document' : 'Add Document'}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Document Type *</Text>
          <TextInput
            value={documentType}
            onChangeText={setDocumentType}
            placeholder="e.g. Passport, Class 2 Medical"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Document Name *</Text>
          <TextInput
            value={documentName}
            onChangeText={setDocumentName}
            placeholder="Enter document name"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Issuer</Text>
          <TextInput
            value={issuer}
            onChangeText={setIssuer}
            placeholder="Issuing authority"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </View>

        <View className="mb-4 flex-row gap-3">
          <DocumentDateField label="Issue Date" value={issueDate} onChange={setIssueDate} />
          <DocumentDateField label="Expiry Date" value={expiryDate} onChange={setExpiryDate} />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Reminder Days Before Expiry</Text>
          <TextInput
            value={reminderDays}
            onChangeText={setReminderDays}
            keyboardType="numeric"
            placeholder="15"
            placeholderTextColor="#64748b"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Document File</Text>
          <Pressable
            onPress={pickFile}
            className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-900">
            <Text className="text-base font-medium text-blue-700 dark:text-blue-400">
              {displayFileName ? 'Change File' : 'Choose File'}
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">PDF, PNG, JPG. File details auto-filled.</Text>
          </Pressable>
          {displayFileName ? (
            <View className="mt-2 flex-row items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
              <View className="mr-2 flex-1">
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">{displayFileName}</Text>
                {selectedFile ? (
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedFile.mimeType || 'application/octet-stream'} • {formatDocumentFileSize(selectedFile.size)}
                  </Text>
                ) : (
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Current file on record</Text>
                )}
              </View>
              <Pressable onPress={clearFile} hitSlop={8}>
                <FontAwesome name="times-circle" size={20} color="#94a3b8" />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View className="mb-2">
          <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </View>

        {error ? <Text className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <Pressable
          onPress={saveDocument}
          disabled={saving}
          className="mt-6 items-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-60">
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">{isEditing ? 'Update Document' : 'Save Document'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
