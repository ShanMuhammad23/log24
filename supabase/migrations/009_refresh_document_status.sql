-- Recompute stored status for all documents (status only updates on insert/update otherwise)
update public.pilot_documents
set expiry_date = expiry_date;
