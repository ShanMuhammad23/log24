import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocsContentSkeleton, DocsStatsSkeleton } from '@/components/docs/DocsContentSkeleton';
import { useSupabaseSession } from '@/utils/auth';
import { consumeDocsReturnPreview, mergeDocumentsWithPreview } from '@/utils/docs-navigation';
import {
  daysUntilExpiry,
  deletePilotDocument,
  documentErrorMessage,
  fetchPilotDocuments,
  PilotDocument,
} from '@/utils/documents';

type FilterTab = 'all' | 'expiring_soon' | 'expired' | 'valid';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: PilotDocument['status'] }) {
  if (status === 'expired') {
    return (
      <View className="rounded-full bg-red-100 px-3 py-1 dark:bg-red-950/60">
        <Text className="text-xs font-medium text-red-600 dark:text-red-400">Expired</Text>
      </View>
    );
  }
  if (status === 'expiring_soon') {
    return (
      <View className="rounded-full bg-amber-100 px-3 py-1 dark:bg-amber-950/60">
        <Text className="text-xs font-medium text-amber-600 dark:text-amber-400">Expiring Soon</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-950/60">
      <Text className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Valid</Text>
    </View>
  );
}

function FilterPill({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active?: boolean;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-center gap-1 rounded-lg p-1 ${
        active
          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}>
      <Text
        className={`text-sm ${active ? 'font-semibold text-blue-700 dark:text-blue-300' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
        {label}
      </Text>
      <View className="rounded-full bg-slate-100 px-2 dark:bg-slate-800">
        <Text className={`text-xs ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function DocumentCard({
  doc,
  onPress,
  onMenuPress,
  deleting,
}: {
  doc: PilotDocument;
  onPress: () => void;
  onMenuPress: () => void;
  deleting?: boolean;
}) {
  const days = daysUntilExpiry(doc.expiry_date);

  return (
    <View className="mb-2.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <Pressable onPress={onPress} className="active:opacity-80">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60">
            <FontAwesome name="id-card-o" size={20} color="#2563eb" />
          </View>

          <View className="flex-1 pr-2">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{doc.document_name}</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">Uploaded on {formatDate(doc.created_at)}</Text>
          </View>

          <View className="items-end">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {doc.status === 'expired' ? 'Expired on' : 'Expires on'}
            </Text>
            <Text
              className={`text-base font-semibold ${
                doc.status === 'expired'
                  ? 'text-red-500 dark:text-red-400'
                  : doc.status === 'expiring_soon'
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              }`}>
              {formatDate(doc.expiry_date)}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {days === null ? '' : days < 0 ? `(${Math.abs(days)} days ago)` : `(In ${days} days)`}
            </Text>
          </View>
        </View>
      </Pressable>

      <View className="mt-2 flex-row items-center justify-between">
        <StatusBadge status={doc.status} />
        <Pressable
          onPress={onMenuPress}
          hitSlop={12}
          disabled={deleting}
          className="h-8 w-8 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800">
          {deleting ? (
            <ActivityIndicator size="small" color="#64748b" />
          ) : (
            <FontAwesome name="ellipsis-v" size={14} color="#64748b" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function DocumentActionsModal({
  visible,
  documentName,
  onClose,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  documentName: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} accessibilityLabel="Close menu" />
        <View className="rounded-t-3xl bg-white px-4 pb-8 pt-3 dark:bg-slate-900">
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-slate-300 dark:bg-slate-600" />
          <Text className="mb-4 text-center text-base font-semibold text-slate-900 dark:text-slate-100" numberOfLines={2}>
            {documentName}
          </Text>

          <Pressable
            onPress={onEdit}
            className="mb-2 flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700">
            <FontAwesome name="pencil" size={18} color="#2563eb" />
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Edit Document</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            className="flex-row items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 active:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:active:bg-red-950/60">
            <FontAwesome name="trash" size={18} color="#dc2626" />
            <Text className="text-base font-semibold text-red-600 dark:text-red-400">Delete Document</Text>
          </Pressable>

          <Pressable onPress={onClose} className="mt-3 items-center py-3">
            <Text className="text-base font-medium text-slate-500 dark:text-slate-400">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function DocsScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [documents, setDocuments] = useState<PilotDocument[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [actionDoc, setActionDoc] = useState<PilotDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const loadDocuments = useCallback(
    async (options?: { silent?: boolean }) => {
      const userId = session?.user?.id;
      if (!userId) {
        if (!options?.silent) setLoading(false);
        return;
      }

      const preview = options?.silent ? consumeDocsReturnPreview() : null;
      if (!options?.silent && !hasLoadedOnce.current) {
        setLoading(true);
      }

      const { data } = await fetchPilotDocuments(userId);
      const fetched = (data || []) as PilotDocument[];
      setDocuments(mergeDocumentsWithPreview(fetched, preview));
      setLoading(false);
      hasLoadedOnce.current = true;
    },
    [session?.user?.id]
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnce.current) return;
      loadDocuments({ silent: true });
    }, [loadDocuments])
  );

  const stats = useMemo(() => {
    const total = documents.length;
    const expiringSoon = documents.filter((item) => item.status === 'expiring_soon').length;
    const expired = documents.filter((item) => item.status === 'expired').length;
    const valid = documents.filter((item) => item.status === 'valid').length;
    return { total, expiringSoon, expired, valid };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    if (filterTab === 'all') return documents;
    return documents.filter((item) => item.status === filterTab);
  }, [documents, filterTab]);

  const showListSkeleton = loading && documents.length === 0;
  const showStatsSkeleton = loading && documents.length === 0;

  const openEdit = (doc: PilotDocument) => {
    setActionDoc(null);
    router.push({ pathname: '/add-document', params: { id: doc.id } });
  };

  const confirmDelete = (doc: PilotDocument) => {
    const docId = doc.id;
    const docName = doc.document_name;

    setActionDoc(null);

    // Alert after modal closes (Android often blocks Alert while a Modal is visible).
    requestAnimationFrame(() => {
      Alert.alert('Delete Document', `Delete "${docName}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const userId = session?.user?.id;
            if (!userId) {
              Alert.alert('Delete failed', 'You are not logged in.');
              return;
            }

            setDeletingId(docId);
            const { error } = await deletePilotDocument(userId, docId);
            setDeletingId(null);

            if (error) {
              Alert.alert('Delete failed', documentErrorMessage(error));
              return;
            }

            setDocuments((prev) => prev.filter((item) => item.id !== docId));
          },
        },
      ]);
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 120 }}>
          <Text className="mb-4 text-center text-3xl font-bold text-slate-900 dark:text-slate-100">Docs</Text>

          <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-[#edf2ff] p-4 dark:border-slate-700 dark:bg-blue-950/40">
            <View className="mb-3 w-2/3">
              <Text className="text-xl font-semibold text-slate-900 dark:text-slate-100">Keep Your Documents Up to Date</Text>
              <Text className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                We'll remind you before any of your documents expire.
              </Text>
            </View>
            {showStatsSkeleton ? (
              <DocsStatsSkeleton />
            ) : (
              <View className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <View className="mb-2 flex-row items-center gap-2">
                  <FontAwesome name="file-text" size={14} color="#2563eb" />
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {String(stats.total).padStart(2, '0')} Total
                  </Text>
                </View>
                <View className="mb-2 flex-row items-center gap-2">
                  <FontAwesome name="clock-o" size={14} color="#f59e0b" />
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {String(stats.expiringSoon).padStart(2, '0')} Expiring
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <FontAwesome name="exclamation-triangle" size={14} color="#ef4444" />
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {String(stats.expired).padStart(2, '0')} Expired
                  </Text>
                </View>
              </View>
            )}
          </View>

          

          {showListSkeleton ? (
            <DocsContentSkeleton />
          ) : (
            <Animated.View entering={hasLoadedOnce.current ? FadeIn.duration(220) : undefined}>
              <View className="mb-3 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                <View className="flex-row  justify-between gap-y-2">
                  <FilterPill
                    label="All"
                    count={stats.total}
                    active={filterTab === 'all'}
                    onPress={() => setFilterTab('all')}
                  />
                  <FilterPill
                    label="Expiring Soon"
                    count={stats.expiringSoon}
                    active={filterTab === 'expiring_soon'}
                    onPress={() => setFilterTab('expiring_soon')}
                  />
                  <FilterPill label="Expired" count={stats.expired} active={filterTab === 'expired'} onPress={() => setFilterTab('expired')} />
                  <FilterPill label="Valid" count={stats.valid} active={filterTab === 'valid'} onPress={() => setFilterTab('valid')} />
                </View>
              </View>

              <View className="mb-2 flex-row items-center justify-between px-1">
                <Text className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your Documents</Text>
                <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">Sort by: Expiry Date</Text>
              </View>

              {filteredDocs.length === 0 ? (
                <View className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">No documents found in this category.</Text>
                </View>
              ) : (
                filteredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    deleting={deletingId === doc.id}
                    onPress={() => {
                      if (doc.id.startsWith('preview-')) return;
                      router.push({
                        pathname: '/document-details/[id]',
                        params: { id: doc.id },
                      });
                    }}
                    onMenuPress={() => {
                      if (doc.id.startsWith('preview-')) return;
                      setActionDoc(doc);
                    }}
                  />
                ))
              )}

              
            </Animated.View>
          )}
        </ScrollView>

        <View className="absolute bottom-4 right-4 items-center">
          <Pressable
            onPress={() => router.push('/add-document')}
            className="h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-400/60">
            <FontAwesome name="plus" size={24} color="#ffffff" />
          </Pressable>
          <Text className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-400">Add Document</Text>
        </View>

        <DocumentActionsModal
          visible={Boolean(actionDoc)}
          documentName={actionDoc?.document_name || ''}
          onClose={() => setActionDoc(null)}
          onEdit={() => {
            if (!actionDoc) return;
            openEdit(actionDoc);
          }}
          onDelete={() => {
            if (!actionDoc) return;
            confirmDelete(actionDoc);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
