# Lex Liga — Photo gallery (Supabase Storage)

Run this **once** in Supabase → **SQL Editor** → New query → Run.

```sql
-- 1) Create public bucket for event photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  5242880, -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2) Policies: anyone can view; upload/delete allowed via anon key
-- (Admin page is password-protected in the UI. For stronger security later, use Supabase Auth.)

drop policy if exists "Public read gallery" on storage.objects;
drop policy if exists "Public upload gallery" on storage.objects;
drop policy if exists "Public update gallery" on storage.objects;
drop policy if exists "Public delete gallery" on storage.objects;

create policy "Public read gallery"
on storage.objects for select
using (bucket_id = 'gallery');

create policy "Public upload gallery"
on storage.objects for insert
with check (bucket_id = 'gallery');

create policy "Public update gallery"
on storage.objects for update
using (bucket_id = 'gallery');

create policy "Public delete gallery"
on storage.objects for delete
using (bucket_id = 'gallery');
```

## How admins upload
1. Open https://lex-liga.github.io/admin.html
2. Choose **Photos** → password `lexliga2026`
3. Select images → Upload
4. Photos appear on the Photo Wall within a few seconds

## Note
Uploads use the public anon key. Do not share the admin URL widely outside the organising team.
