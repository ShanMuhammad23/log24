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
  created_at: string;
};

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
    .select('id, user_id, document_type, document_name, expiry_date, issue_date, status, file_name, file_path, created_at')
    .eq('user_id', userId)
    .order('expiry_date', { ascending: true, nullsFirst: false });
}

export async function createPilotDocument(payload: CreatePilotDocumentInput) {
  return supabase.from('pilot_documents').insert(payload).select('id').single();
}
