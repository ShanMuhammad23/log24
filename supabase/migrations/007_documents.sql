-- Pilot documents with expiry tracking

create table if not exists public.pilot_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  document_type text not null,
  document_name text not null,
  issuer text,
  issue_date date,
  expiry_date date,
  reminder_days_before integer not null default 15 check (reminder_days_before >= 0 and reminder_days_before <= 365),
  file_name text,
  file_path text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  notes text,
  status text not null default 'valid' check (status in ('valid', 'expiring_soon', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pilot_documents_user on public.pilot_documents(user_id);
create index if not exists idx_pilot_documents_expiry on public.pilot_documents(expiry_date);
create index if not exists idx_pilot_documents_status on public.pilot_documents(status);

create or replace function public.set_pilot_document_status()
returns trigger
language plpgsql
as $$
declare
  days_left integer;
begin
  if new.expiry_date is null then
    new.status := 'valid';
    return new;
  end if;

  days_left := (new.expiry_date - current_date);
  if days_left < 0 then
    new.status := 'expired';
  elsif days_left <= coalesce(new.reminder_days_before, 15) then
    new.status := 'expiring_soon';
  else
    new.status := 'valid';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_pilot_documents_status on public.pilot_documents;
create trigger trg_pilot_documents_status
before insert or update of expiry_date, reminder_days_before
on public.pilot_documents
for each row
execute function public.set_pilot_document_status();

drop trigger if exists trg_pilot_documents_updated_at on public.pilot_documents;
create trigger trg_pilot_documents_updated_at
before update on public.pilot_documents
for each row
execute function public.set_updated_at();
