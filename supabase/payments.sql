-- prozivka · Ödeme takibi
-- Supabase panelinde SQL Editor'de BİR KEZ çalıştır.
-- Tekrar çalıştırılırsa zarar vermez (if not exists / drop policy if exists).

-- 1) Öğrenciye aylık aidat
alter table public.students
  add column if not exists monthly_fee numeric(10, 2)
    check (monthly_fee is null or monthly_fee >= 0);

-- 2) Ödemeler tablosu
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  period      text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  amount      numeric(10, 2) not null default 0 check (amount >= 0),
  status      text not null default 'bekliyor' check (status in ('odendi', 'bekliyor')),
  paid_at     date,
  note        text,
  created_at  timestamptz not null default now(),
  unique (student_id, period)
);

create index if not exists payments_user_period_idx
  on public.payments (user_id, period);

-- 3) RLS: diğer tablolarla aynı desen
alter table public.payments enable row level security;

drop policy if exists "payments_sahibi" on public.payments;
create policy "payments_sahibi"
  on public.payments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
