import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import {
  createPilotDocumentSignedUrl,
  fetchPilotDocumentById,
  formatDocumentFileSize,
  isImageMimeType,
  PilotDocument,
} from '@/utils/documents';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dayDiffFromNow(dateValue: string | null) {
  if (!dateValue) return null;
  const now = new Date();
  const expiry = new Date(dateValue);
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: PilotDocument['status'] }) {
  if (status === 'expired') {
    return (
      <View className="rounded-full bg-red-100 px-3 py-1">
        <Text className="text-xs font-medium text-red-600">Expired</Text>
      </View>
    );
  }
  if (status === 'expiring_soon') {
    return (
      <View className="rounded-full bg-amber-100 px-3 py-1">
        <Text className="text-xs font-medium text-amber-600">Expiring Soon</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-emerald-100 px-3 py-1">
      <Text className="text-xs font-medium text-emerald-600">Valid</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 flex-row items-start justify-between gap-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-slate-900">{value}</Text>
    </View>
  );
}

export default function DocumentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSupabaseSession();
  const [document, setDocument] = useState<PilotDocument | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingFile, setOpeningFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const userId = session?.user?.id;
      if (!userId || !id) {
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      setFileError(null);
      setFileUrl(null);

      const { data, error } = await fetchPilotDocumentById(userId, id);
      if (cancelled) return;

      if (error || !data) {
        setDocument(null);
        setLoading(false);
        return;
      }

      setDocument(data);

      if (data.file_path) {
        const { data: signed, error: signError } = await createPilotDocumentSignedUrl(data.file_path);
        if (!cancelled) {
          if (signError || !signed?.signedUrl) {
            setFileError(signError?.message || 'Could not load file preview.');
          } else {
            setFileUrl(signed.signedUrl);
          }
        }
      }

      if (!cancelled) setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, session?.user?.id]);

  const openFileExternally = async () => {
    if (!fileUrl) {
      Alert.alert('File unavailable', fileError || 'No file is attached to this document.');
      return;
    }

    setOpeningFile(true);
    try {
      await WebBrowser.openBrowserAsync(fileUrl);
    } finally {
      setOpeningFile(false);
    }
  };

  if (!loading && !document) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-slate-600">Document not found.</Text>
          <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-blue-600 px-5 py-3">
            <Text className="font-semibold text-white">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const days = dayDiffFromNow(document?.expiry_date ?? null);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}>
        <View className="mb-4 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-200">
            <FontAwesome name="angle-left" size={18} color="#0f172a" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-slate-900">Document Details</Text>
        </View>

        {loading ? (
          <View className="mt-12 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : document ? (
          <Animated.View entering={FadeIn.duration(220)}>
            <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <FontAwesome name="id-card-o" size={22} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-slate-900">{document.document_name}</Text>
                  <Text className="mt-1 text-sm text-slate-500">{document.document_type}</Text>
                  <View className="mt-2 self-start">
                    <StatusBadge status={document.status} />
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Text className="mb-3 text-base font-semibold text-slate-900">Information</Text>
              <DetailRow label="Issuer" value={document.issuer?.trim() || '—'} />
              <DetailRow label="Issue date" value={formatDate(document.issue_date)} />
              <DetailRow label="Expiry date" value={formatDate(document.expiry_date)} />
              <DetailRow
                label="Expiry"
                value={
                  days === null
                    ? '—'
                    : days < 0
                      ? `Expired ${Math.abs(days)} days ago`
                      : `In ${days} days`
                }
              />
              <DetailRow
                label="Reminder"
                value={
                  document.reminder_days_before != null
                    ? `${document.reminder_days_before} days before`
                    : '—'
                }
              />
              <DetailRow label="Uploaded" value={formatDate(document.created_at)} />
              {document.notes?.trim() ? (
                <View className="mt-1 border-t border-slate-100 pt-3">
                  <Text className="text-sm text-slate-500">Notes</Text>
                  <Text className="mt-1 text-sm leading-5 text-slate-800">{document.notes.trim()}</Text>
                </View>
              ) : null}
            </View>

            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <Text className="mb-3 text-base font-semibold text-slate-900">Attached file</Text>

              {document.file_path ? (
                <>
                  <DetailRow label="File name" value={document.file_name || '—'} />
                  <DetailRow label="Type" value={document.mime_type || '—'} />
                  <DetailRow label="Size" value={formatDocumentFileSize(document.size_bytes)} />

                  {fileUrl && isImageMimeType(document.mime_type) ? (
                    <View className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <Image source={{ uri: fileUrl }} className="h-72 w-full" resizeMode="contain" />
                    </View>
                  ) : null}

                  {fileError ? <Text className="mb-3 text-sm text-red-500">{fileError}</Text> : null}

                  <Pressable
                    onPress={openFileExternally}
                    disabled={openingFile || !fileUrl}
                    className="flex-row items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 active:bg-blue-700 disabled:opacity-60">
                    {openingFile ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <FontAwesome name="external-link" size={16} color="#ffffff" />
                        <Text className="text-base font-semibold text-white">
                          {isImageMimeType(document.mime_type) ? 'Open full file' : 'View file'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              ) : (
                <Text className="text-sm text-slate-500">No file was uploaded for this document.</Text>
              )}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
