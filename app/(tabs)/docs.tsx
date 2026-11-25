import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { MIST, SUB } from '@/constants/Colors';
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
import { syncDocumentExpiryNotifications } from '@/utils/document-notifications';

type FilterTab = 'all' | 'expiring_soon' | 'expired' | 'valid';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_STYLE = {
  expired: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Expired' },
  expiring_soon: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Expiring soon' },
  valid: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Valid' },
} as const;

function StatusBadge({ status }: { status: PilotDocument['status'] }) {
  const style = STATUS_STYLE[status];
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
    </View>
  );
}

function FilterPill({
  label,
  active,
  count,
  showDivider,
  onPress,
}: {
  label: string;
  active?: boolean;
  count: number;
  showDivider?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1 py-2.5 ${
        showDivider ? 'border-l border-rule dark:border-ruleDark' : ''
      } ${active ? 'bg-arc/10' : ''}`}>
      <Text
        className={`text-[13px] ${active ? 'font-semibold text-arcDeep dark:text-arc' : 'font-medium text-sub dark:text-mist'}`}>
        {label}
      </Text>
      <Text className={`text-xs ${active ? 'text-arcDeep dark:text-arc' : 'text-sub dark:text-mist'}`}>
        {count}
      </Text>
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
  const isDark = useColorScheme() === 'dark';
  const days = daysUntilExpiry(doc.expiry_date);

  return (
    <View className="mb-2 rounded-lg border border-rule bg-white p-3 dark:border-ruleDark dark:bg-panel">
      <Pressable onPress={onPress} className="active:opacity-80">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-md border border-rule dark:border-ruleDark">
            <FontAwesome name="id-card-o" size={18} color="#2EA8FF" />
          </View>

          <View className="flex-1 pr-2">
            <Text className="text-base font-semibold text-ink dark:text-white">{doc.document_name}</Text>
            <Text className="text-sm text-sub dark:text-mist">Uploaded {formatDate(doc.created_at)}</Text>
          </View>

          <View className="items-end">
            <Text className="text-sm text-sub dark:text-mist">
              {doc.status === 'expired' ? 'Expired' : 'Expires'}
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
            <Text className="text-xs text-sub dark:text-mist">
              {days === null ? '' : days < 0 ? `${Math.abs(days)} days ago` : `in ${days} days`}
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
          className="h-8 w-8 items-center justify-center rounded-md active:bg-paper dark:active:bg-night">
          {deleting ? (
            <ActivityIndicator size="small" color={isDark ? MIST : SUB} />
          ) : (
            <FontAwesome name="ellipsis-v" size={14} color={isDark ? MIST : SUB} />
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
        <View className="rounded-t-xl border-t border-rule bg-white px-4 pb-8 pt-3 dark:border-ruleDark dark:bg-panel">
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-rule dark:bg-ruleDark" />
          <Text className="mb-4 text-center text-base font-semibold text-ink dark:text-white" numberOfLines={2}>
            {documentName}
          </Text>

          <Pressable
            onPress={onEdit}
            className="mb-2 flex-row items-center gap-3 rounded-lg border border-rule bg-paper px-4 py-3.5 active:bg-rule dark:border-ruleDark dark:bg-night">
            <FontAwesome name="pencil" size={16} color="#2EA8FF" />
            <Text className="text-base font-semibold text-ink dark:text-white">Edit document</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            className="flex-row items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 active:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40">
            <FontAwesome name="trash" size={16} color="#dc2626" />
            <Text className="text-base font-semibold text-red-600 dark:text-red-400">Delete document</Text>
          </Pressable>

          <Pressable onPress={onClose} className="mt-3 items-center py-3">
            <Text className="text-base font-medium text-sub dark:text-mist">Cancel</Text>
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
            await syncDocumentExpiryNotifications(userId);
          },
        },
      ]);
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-paper dark:bg-night">
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120 }}>
          <Text className="mb-1 text-2xl font-bold text-ink dark:text-white">Documents</Text>
          <Text className="mb-5 text-sm text-sub dark:text-mist">
            Licenses and certificates — we'll remind you before anything expires.
          </Text>

          <View className="mb-3 rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
            {showStatsSkeleton ? (
              <DocsStatsSkeleton />
            ) : (
              <View className="flex-row">
                <View className="flex-1 items-center py-3.5">
                  <Text className="text-xl font-bold text-ink dark:text-white">
                    {String(stats.total).padStart(2, '0')}
                  </Text>
                  <Text className="mt-0.5 text-xs text-sub dark:text-mist">Total</Text>
                </View>
                <View className="flex-1 items-center border-l border-rule py-3.5 dark:border-ruleDark">
                  <Text className="text-xl font-bold text-amber-500">
                    {String(stats.expiringSoon).padStart(2, '0')}
                  </Text>
                  <Text className="mt-0.5 text-xs text-sub dark:text-mist">Expiring</Text>
                </View>
                <View className="flex-1 items-center border-l border-rule py-3.5 dark:border-ruleDark">
                  <Text className="text-xl font-bold text-red-500">
                    {String(stats.expired).padStart(2, '0')}
                  </Text>
                  <Text className="mt-0.5 text-xs text-sub dark:text-mist">Expired</Text>
                </View>
              </View>
            )}
          </View>

          {showListSkeleton ? (
            <DocsContentSkeleton />
          ) : (
            <Animated.View entering={hasLoadedOnce.current ? FadeIn.duration(220) : undefined}>
              <View className="mb-4 flex-row overflow-hidden rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
                <FilterPill
                  label="All"
                  count={stats.total}
                  active={filterTab === 'all'}
                  onPress={() => setFilterTab('all')}
                />
                <FilterPill
                  label="Expiring"
                  count={stats.expiringSoon}
                  active={filterTab === 'expiring_soon'}
                  showDivider
                  onPress={() => setFilterTab('expiring_soon')}
                />
                <FilterPill
                  label="Expired"
                  count={stats.expired}
                  active={filterTab === 'expired'}
                  showDivider
                  onPress={() => setFilterTab('expired')}
                />
                <FilterPill
                  label="Valid"
                  count={stats.valid}
                  active={filterTab === 'valid'}
                  showDivider
                  onPress={() => setFilterTab('valid')}
                />
              </View>

              {filteredDocs.length === 0 ? (
                <View className="rounded-lg border border-rule bg-white p-4 dark:border-ruleDark dark:bg-panel">
                  <Text className="text-sm text-sub dark:text-mist">No documents in this category.</Text>
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
            className="h-14 w-14 items-center justify-center rounded-full bg-arc">
            <FontAwesome name="plus" size={22} color="#0A1428" />
          </Pressable>
          <Text className="mt-1.5 text-xs font-semibold text-arcDeep dark:text-arc">Add document</Text>
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
