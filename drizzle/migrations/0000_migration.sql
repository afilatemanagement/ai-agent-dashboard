create table public.app_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.audit_log (
  id bigint generated always as identity primary key,
  action text not null,
  target text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);
grant all on public.app_settings, public.roles, public.audit_log to service_role;
alter table public.app_settings enable row level security;
alter table public.roles enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.log_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'app_settings' then
    insert into audit_log(action, target, detail) values (lower(tg_op), 'setting', coalesce(new.key, old.key));
  else
    insert into audit_log(action, target, detail) values (lower(tg_op), 'role', coalesce(new.name, old.name));
  end if;
  return coalesce(new, old);
end $$;
create trigger app_settings_audit after insert or update or delete on public.app_settings for each row execute function public.log_change();
create trigger roles_audit after insert or update or delete on public.roles for each row execute function public.log_change();