# Lex Liga Futsal – Extra Time, Penalties & Sudden Death

## Database setup

Run this in the Supabase SQL Editor:

```sql
alter table public.matches
  add column if not exists pens_on boolean default false,
  add column if not exists pen_home integer default 0,
  add column if not exists pen_away integer default 0,
  add column if not exists pens_sudden boolean default false;

alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (
    status in (
      'not_started',
      'live',
      'half_time',
      'extra_time',
      'penalties',
      'finished',
      'walkover'
    )
  );

alter table public.matches
  drop constraint if exists matches_penalty_state_check;

alter table public.matches
  add constraint matches_penalty_state_check
  check (
    status <> 'penalties'
    or pens_on is true
  );

alter table public.matches
  drop constraint if exists matches_sudden_death_state_check;

alter table public.matches
  add constraint matches_sudden_death_state_check
  check (
    pens_sudden is not true
    or (
      pens_on is true
      and status in ('penalties', 'finished')
    )
  );

alter table public.matches
  drop constraint if exists matches_penalty_values_check;

alter table public.matches
  add constraint matches_penalty_values_check
  check (
    pen_home is not null
    and pen_away is not null
    and pen_home >= 0
    and pen_away >= 0
  );
