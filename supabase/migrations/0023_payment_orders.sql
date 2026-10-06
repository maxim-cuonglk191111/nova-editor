-- 0023 — VietQR bank-transfer payments (SePay / PayOS).
--
-- processed_payments: the code has always written amount / plan / status, but the
-- table never had them, so every grant insert failed and the PayOS webhook
-- mistook the error for "already processed". Add the columns.
alter table processed_payments add column if not exists amount integer;
alter table processed_payments add column if not exists plan text;
alter table processed_payments add column if not exists status text not null default 'success';

-- payment_orders: one row per checkout. A bank transfer only carries its
-- description ("NOVA<order_code>"), so the order row is what ties a transfer
-- back to the user, plan and expected amount.
create table if not exists payment_orders (
  order_code  text primary key,
  provider    text not null,                 -- 'sepay' | 'payos'
  user_id     uuid references users(id) on delete cascade,
  team_id     text,
  plan        text not null,                 -- 'pro' | 'max' | 'team' | 'credits'
  amount      integer not null,              -- VND
  status      text not null default 'pending' check (status in ('pending', 'paid')),
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

create index if not exists idx_payment_orders_user on payment_orders(user_id, created_at desc);

alter table payment_orders enable row level security;
-- No policies = only the service role key (server-side) can read/write.
