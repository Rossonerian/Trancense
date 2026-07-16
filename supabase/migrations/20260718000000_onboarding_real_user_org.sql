-- New authentication users receive a profile only. Organizations and memberships
-- are created by the authenticated onboarding flow after the user supplies real data.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, job_role, country, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'job_role', ''),
    coalesce(new.raw_user_meta_data ->> 'country', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    job_role = case when public.profiles.job_role = '' then excluded.job_role else public.profiles.job_role end,
    country = case when public.profiles.country = '' then excluded.country else public.profiles.country end,
    phone = coalesce(public.profiles.phone, excluded.phone),
    updated_at = now();
  return new;
end;
$$;
