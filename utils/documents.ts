import { supabase } from '@/utils/supabase';

export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired';

export type PilotDocument = {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  expiry_date: string | null;
  issue_date: string | null;
  status: DocumentStatus;
  file_name: string | null;
  file_path: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  issuer?: string | null;
  reminder_days_before?: number | null;
  notes?: string | null;
  created_at: string;
};

const DOCUMENT_SELECT =
  'id, user_id, document_type, document_name, expiry_date, issue_date, status, file_name, file_path, mime_type, size_bytes, issuer, reminder_days_before, notes, created_at';

/** Parse YYYY-MM-DD in local calendar (avoids UTC date-shift bugs). */
export function parseLocalDateOnly(value: string) {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Whole days from today until expiry (negative = already expired). */
export function daysUntilExpiry(expiryDate: string | null) {
  if (!expiryDate) return null;
  const expiry = parseLocalDateOnly(expiryDate);
  if (!expiry || Number.isNaN(expiry.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeDocumentStatus(
  expiryDate: string | null,
  reminderDaysBefore = 15
): DocumentStatus {
  const daysLeft = daysUntilExpiry(expiryDate);
  if (daysLeft === null) return 'valid';
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= reminderDaysBefore) return 'expiring_soon';
  return 'valid';
}

export function enrichPilotDocument<T extends PilotDocument>(doc: T): T {
  return {
    ...doc,
    status: computeDocumentStatus(doc.expiry_date, doc.reminder_days_before ?? 15),
  };
}

export function enrichPilotDocuments(docs: PilotDocument[]) {
  return docs.map(enrichPilotDocument);
}

export type CreatePilotDocumentInput = {
  user_id: string;
  document_type: string;
  document_name: string;
  issuer?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  reminder_days_before?: number;
  file_name?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  notes?: string | null;
};

export async function fetchPilotDocuments(userId: string) {
  const result = await supabase
    .from('pilot_documents')
    .select(DOCUMENT_SELECT)
    .eq('user_id', userId)
    .order('expiry_date', { ascending: true, nullsFirst: false });

  if (result.data) {
    return { ...result, data: enrichPilotDocuments(result.data as PilotDocument[]) };
  }
  return result;
}

export async function fetchPilotDocumentById(userId: string, documentId: string) {
  const result = await supabase
    .from('pilot_documents')
    .select(DOCUMENT_SELECT)
    .eq('user_id', userId)
    .eq('id', documentId)
    .maybeSingle<PilotDocument>();

  if (result.data) {
    return { ...result, data: enrichPilotDocument(result.data) };
  }
  return result;
}

export async function createPilotDocumentSignedUrl(filePath: string, expiresInSeconds = 3600) {
  return supabase.storage.from('pilot-documents').createSignedUrl(filePath, expiresInSeconds);
}

export function formatDocumentFileSize(sizeBytes: number | null | undefined) {
  if (sizeBytes == null || sizeBytes <= 0) return '—';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMimeType(mimeType: string | null | undefined) {
  return Boolean(mimeType?.startsWith('image/'));
}

export async function createPilotDocument(payload: CreatePilotDocumentInput) {
  return supabase.from('pilot_documents').insert(payload).select('id').single();
}

export type UpdatePilotDocumentInput = {
  document_type?: string;
  document_name?: string;
  issuer?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  reminder_days_before?: number;
  file_name?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  notes?: string | null;
};

export async function updatePilotDocument(userId: string, documentId: string, payload: UpdatePilotDocumentInput) {
  return supabase.from('pilot_documents').update(payload).eq('user_id', userId).eq('id', documentId);
}

export async function deletePilotDocument(userId: string, documentId: string) {
  const { data: doc, error: fetchError } = await fetchPilotDocumentById(userId, documentId);
  if (fetchError) return { error: fetchError };
  if (!doc) return { error: new Error('Document not found') };

  const { error: deleteError } = await supabase.from('pilot_documents').delete().eq('user_id', userId).eq('id', documentId);
  if (deleteError) return { error: deleteError };

  if (doc.file_path) {
    await supabase.storage.from('pilot-documents').remove([doc.file_path]);
  }

  return { error: null };
}
