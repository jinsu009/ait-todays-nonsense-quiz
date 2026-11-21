begin;

create schema tnq;
revoke all on schema tnq from public, anon, authenticated;

create table tnq.users (
  id uuid primary key default gen_random_uuid(),
  subject text not null unique
);

create table tnq.quizzes (
  quiz_date date primary key,
  question text not null,
  answer text not null,
  hints text[] not null default '{}',
  check (cardinality(hints) <= 2)
);

create table tnq.attempts (
  user_id uuid not null references tnq.users (id),
  quiz_date date not null references tnq.quizzes (quiz_date),
  answer text,
  hints_opened integer not null default 0 check (hints_opened between 0 and 2),
  checked_at timestamptz,
  is_correct boolean,
  primary key (user_id, quiz_date),
  check (answer is null or char_length(answer) between 1 and 80),
  check ((checked_at is null) = (is_correct is null))
);

alter table tnq.users enable row level security;
alter table tnq.quizzes enable row level security;
alter table tnq.attempts enable row level security;

commit;
