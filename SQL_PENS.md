# Futsal penalties + sudden death

Run in Supabase SQL Editor:

```sql
alter table matches
  add column if not exists pens_on boolean default false,
  add column if not exists pen_home integer default 0,
  add column if not exists pen_away integer default 0,
  add column if not exists pens_sudden boolean default false;

alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches add constraint matches_status_check
check (status in ('not_started','live','half_time','penalties','finished','walkover'));
```

## Admin flow
1. Match draws → **Start penalties**
2. +1 pen for each scored kick (5 each)
3. If still level after 5 each → **Enter sudden death**
4. Continue +1 until one leads → **Finished**
5. Site shows score + Pens X–Y (+ Sudden death) + Winner (on pens)
