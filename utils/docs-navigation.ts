import { computeDocumentStatus, PilotDocument } from '@/utils/documents';

let pendingReturnPreview: PilotDocument | null = null;

export function stageDocsReturnPreview(input: {
  user_id: string;
  document_type: string;
  document_name: string;
  expiry_date?: string | null;
  issue_date?: string | null;
  reminder_days_before?: number;
}) {
  pendingReturnPreview = {
    id: `preview-${Date.now()}`,
    user_id: input.user_id,
    document_type: input.document_type,
    document_name: input.document_name,
    expiry_date: input.expiry_date ?? null,
    issue_date: input.issue_date ?? null,
    status: computeDocumentStatus(input.expiry_date ?? null, input.reminder_days_before ?? 15),
    file_name: null,
    file_path: null,
    created_at: new Date().toISOString(),
  };
}

export function consumeDocsReturnPreview() {
  const preview = pendingReturnPreview;
  pendingReturnPreview = null;
  return preview;
}

export function mergeDocumentsWithPreview(fetched: PilotDocument[], preview: PilotDocument | null) {
  if (!preview) return fetched;
  const alreadyPresent = fetched.some(
    (doc) => doc.document_name === preview.document_name && doc.expiry_date === preview.expiry_date
  );
  if (alreadyPresent) return fetched;
  return [preview, ...fetched];
}
