# Futsal penalties — run once in Supabase SQL Editor

```sql
alter table matches
  add column if not exists pens_on boolean default false,
  add column if not exists pen_home integer default 0,
  add column if not exists pen_away integer default 0;

-- optional: backfill nulls
update matches set pens_on = false where pens_on is null;
update matches set pen_home = 0 where pen_home is null;
update matches set pen_away = 0 where pen_away is null;
```

## How it works on matchday
1. Normal time ends **drawn** (e.g. 2–2).
2. Admin taps **Start penalties**.
3. Use **+1 / –1 pens** for each side (5 kicks each, then sudden death if still level — you just keep adding points).
4. Mark **Finished** when one side wins the shootout.
5. Public site shows e.g. `2 – 2 (3–4 pens)` and the winner.
