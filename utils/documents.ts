import { supabase } from '@/utils/supabase';

export type PilotDocument = {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  expiry_date: string | null;
  issue_date: string | null;
  status: 'valid' | 'expiring_soon' | 'expired';
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
  return supabase
    .from('pilot_documents')
    .select(DOCUMENT_SELECT)
    .eq('user_id', userId)
    .order('expiry_date', { ascending: true, nullsFirst: false });
}

export async function fetchPilotDocumentById(userId: string, documentId: string) {
  return supabase
    .from('pilot_documents')
    .select(DOCUMENT_SELECT)
    .eq('user_id', userId)
    .eq('id', documentId)
    .maybeSingle<PilotDocument>();
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
