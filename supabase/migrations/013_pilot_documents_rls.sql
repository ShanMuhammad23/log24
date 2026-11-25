-- RLS for pilot_documents (required for delete/update from the app)

alter table public.pilot_documents enable row level security;

drop policy if exists pilot_documents_select_own on public.pilot_documents;
create policy pilot_documents_select_own
  on public.pilot_documents
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists pilot_documents_insert_own on public.pilot_documents;
create policy pilot_documents_insert_own
  on public.pilot_documents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists pilot_documents_update_own on public.pilot_documents;
create policy pilot_documents_update_own
  on public.pilot_documents
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists pilot_documents_delete_own on public.pilot_documents;
create policy pilot_documents_delete_own
  on public.pilot_documents
  for delete
  to authenticated
  using (auth.uid() = user_id);
