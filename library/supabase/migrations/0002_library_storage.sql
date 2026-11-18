insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'library-documents',
  'library-documents',
  false,
  104857600,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'library-covers',
  'library-covers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy library_objects_select on storage.objects
for select to authenticated
using (
  bucket_id in ('library-documents', 'library-covers')
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
    or exists (
      select 1 from public.books
      where books.file_path = storage.objects.name
         or books.cover_path = storage.objects.name
    )
  )
);

create policy library_documents_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'library-documents'
  and (storage.extension(name) = 'pdf')
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
      and storage.filename(name) = 'document.pdf'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[3])::uuid
          and books.owner_id = (select auth.uid())
      )
    )
    or (
      public.is_admin()
      and (storage.foldername(name))[1] = 'catalog'
      and storage.filename(name) = 'document.pdf'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[2])::uuid
          and books.owner_id is null
      )
    )
  )
);

create policy library_covers_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'library-covers'
  and (storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp'))
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
      and storage.filename(name) like 'cover.%'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[3])::uuid
          and books.owner_id = (select auth.uid())
      )
    )
    or (
      public.is_admin()
      and (storage.foldername(name))[1] = 'catalog'
      and storage.filename(name) like 'cover.%'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[2])::uuid
          and books.owner_id is null
      )
    )
  )
);

create policy library_documents_update on storage.objects
for update to authenticated
using (
  bucket_id = 'library-documents'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
)
with check (
  bucket_id = 'library-documents'
  and (storage.extension(name) = 'pdf')
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
      and storage.filename(name) = 'document.pdf'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[3])::uuid
          and books.owner_id = (select auth.uid())
      )
    )
    or (
      public.is_admin()
      and (storage.foldername(name))[1] = 'catalog'
      and storage.filename(name) = 'document.pdf'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[2])::uuid
          and books.owner_id is null
      )
    )
  )
);

create policy library_covers_update on storage.objects
for update to authenticated
using (
  bucket_id = 'library-covers'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
)
with check (
  bucket_id = 'library-covers'
  and (storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp'))
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
      and storage.filename(name) like 'cover.%'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[3])::uuid
          and books.owner_id = (select auth.uid())
      )
    )
    or (
      public.is_admin()
      and (storage.foldername(name))[1] = 'catalog'
      and storage.filename(name) like 'cover.%'
      and exists (
        select 1 from public.books
        where books.id = ((storage.foldername(name))[2])::uuid
          and books.owner_id is null
      )
    )
  )
);

create policy library_objects_delete on storage.objects
for delete to authenticated
using (
  bucket_id in ('library-documents', 'library-covers')
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
);
