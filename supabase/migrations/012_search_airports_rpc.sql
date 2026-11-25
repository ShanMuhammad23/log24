-- Fast airport search over large catalog (used by From/To fields)

create or replace function public.search_airports(
  search_query text,
  result_limit integer default 20
)
returns table (
  iata text,
  icao text,
  name text,
  city text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.iata,
    a.icao,
    a.name,
    a.city
  from public.airports a
  where
    coalesce(trim(search_query), '') <> ''
    and (
      a.icao ilike '%' || trim(search_query) || '%'
      or coalesce(a.iata, '') ilike '%' || trim(search_query) || '%'
      or a.name ilike '%' || trim(search_query) || '%'
      or coalesce(a.city, '') ilike '%' || trim(search_query) || '%'
    )
  order by
    case when a.icao ilike trim(search_query) || '%' then 0 else 1 end,
    case when coalesce(a.iata, '') ilike trim(search_query) || '%' then 0 else 1 end,
    a.name
  limit greatest(1, least(coalesce(result_limit, 20), 50));
$$;

revoke all on function public.search_airports(text, integer) from public;
grant execute on function public.search_airports(text, integer) to authenticated;
