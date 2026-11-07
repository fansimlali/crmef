-- =====================================================================
-- ترحيل الهوية والصلاحيات: منصة اختبار CRMEF
-- يستبدل كل سياسات جدول questions: قراءة للعموم، وكتابة للمشرف حصرا.
-- نفّذ كل جزء على حدة في Supabase > SQL Editor. الجزءان 1 و2 قابلان للتكرار.
-- صدّر جدول questions كملف CSV قبل البدء (نسخة احتياطية).
-- =====================================================================


-- ---------------------------------------------------------------------
-- الجزء 0: فحص الحالة الحالية (قراءة فقط)
-- ---------------------------------------------------------------------
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'questions';

-- حسابات تحمل اسما أو بيانات توحي بصلاحية مشرف: راجعها واحذف ما لا تعرفه
-- من Authentication > Users.
select id, email, created_at, raw_user_meta_data->>'role' as meta_role
from auth.users
where lower(email) like 'admin%' or raw_user_meta_data->>'role' = 'admin'
order by created_at;


-- ---------------------------------------------------------------------
-- الجزء 1: الأدوار والاشتراكات وإغلاق الكتابة العامة
-- ---------------------------------------------------------------------
begin;

-- 1.1 الملفات الشخصية والأدوار. الدور لا يُقرأ ولا يُكتب من المتصفح إطلاقا.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
-- لا توجد سياسة تحديث: لا يستطيع مستخدم تغيير دوره بنفسه.

-- 1.2 إنشاء ملف شخصي تلقائيا عند كل تسجيل جديد
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 100))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ملفات للحسابات الموجودة سابقا
insert into public.profiles (id, full_name)
select id, left(coalesce(raw_user_meta_data->>'full_name', ''), 100)
from auth.users
on conflict (id) do nothing;

-- 1.3 هل المستخدم الحالي مشرف؟
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 1.4 الاشتراكات (يفعّلها المشرف بعد استلام الدفع)
create table if not exists public.entitlements (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  plan       text not null default 'season',
  expires_at timestamptz not null,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;
revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;

drop policy if exists "own_entitlement" on public.entitlements;
create policy "own_entitlement" on public.entitlements
  for select to authenticated
  using (user_id = (select auth.uid()));

-- 1.5 هل لدى المستخدم اشتراك ساري (أو هو مشرف)؟
create or replace function public.has_access()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.entitlements e
    where e.user_id = auth.uid() and e.expires_at > now()
  );
$$;

revoke all on function public.has_access() from public;
grant execute on function public.has_access() to anon, authenticated;

-- 1.6 حالة المستخدم الحالي: الدور وتاريخ انتهاء الاشتراك (تستعملها الواجهة)
create or replace function public.my_access()
returns table (role text, expires_at timestamptz)
language sql stable security definer
set search_path = public
as $$
  select
    coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'user'),
    (select e.expires_at from public.entitlements e
      where e.user_id = auth.uid() and e.expires_at > now());
$$;

revoke all on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- 1.7 جدول الأسئلة: قراءة للعموم، وكتابة للمشرف فقط
alter table public.questions enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'questions'
  loop
    execute format('drop policy %I on public.questions', p.policyname);
  end loop;
end $$;

create policy "questions_read" on public.questions
  for select to anon, authenticated
  using (true);

create policy "questions_admin_insert" on public.questions
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "questions_admin_update" on public.questions
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "questions_admin_delete" on public.questions
  for delete to authenticated
  using ((select public.is_admin()));

revoke insert, update, delete, truncate on public.questions from anon;
revoke truncate on public.questions from authenticated;
grant insert, update, delete on public.questions to authenticated;

commit;


-- ---------------------------------------------------------------------
-- الجزء 2: أدوات المشرف (تُنفَّذ من SQL Editor فقط، ولا يصل إليها المتصفح)
-- ---------------------------------------------------------------------
begin;

-- منح أو سحب صلاحية المشرف. ينشئ المستخدم حسابه أولا من الموقع.
create or replace function public.set_admin(p_email text, p_make_admin boolean default true)
returns text
language plpgsql security definer
set search_path = public
as $$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email);
  if v_uid is null then
    return 'لا يوجد مستخدم بهذا البريد: يجب أن ينشئ حسابه أولا';
  end if;

  insert into public.profiles (id, role)
  values (v_uid, case when p_make_admin then 'admin' else 'user' end)
  on conflict (id) do update set role = excluded.role;

  return case when p_make_admin then 'تم منح صلاحية المشرف' else 'تم سحب صلاحية المشرف' end;
end;
$$;

revoke all on function public.set_admin(text, boolean) from public, anon, authenticated;

-- تفعيل اشتراك لمستخدم بعد استلام الدفع (بالأيام)
create or replace function public.grant_access(
  p_email text,
  p_days  integer default 30,
  p_note  text    default null
)
returns text
language plpgsql security definer
set search_path = public
as $$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email);
  if v_uid is null then
    return 'لا يوجد مستخدم بهذا البريد: يجب أن ينشئ حسابه أولا';
  end if;

  insert into public.entitlements (user_id, expires_at, note)
  values (v_uid, now() + make_interval(days => p_days), p_note)
  on conflict (user_id) do update
    set expires_at = greatest(public.entitlements.expires_at, now())
                     + make_interval(days => p_days),
        note = coalesce(excluded.note, public.entitlements.note);

  return 'تم التفعيل';
end;
$$;

revoke all on function public.grant_access(text, integer, text) from public, anon, authenticated;

commit;


-- ---------------------------------------------------------------------
-- بعد التنفيذ
-- ---------------------------------------------------------------------
-- 1) أنشئ حسابك من الموقع، ثم اجعله مشرفا (لا يوجد أي مشرف قبل هذه الخطوة):
--      select public.set_admin('you@example.com', true);
-- 2) تفعيل اشتراك بعد استلام الدفع:
--      select public.grant_access('user@example.com', 25, 'Cash Plus 07/11');
-- 3) اختبارات (كل سطر داخل rollback). يجب أن يفشل الأول والثاني بـ permission denied:
--      begin; set local role anon; delete from public.questions; rollback;
--      begin; set local role anon; insert into public.questions (id) values ('x'); rollback;
-- 4) مراجعة المشرفين:
--      select p.id, u.email, p.role from public.profiles p join auth.users u on u.id = p.id where p.role = 'admin';
