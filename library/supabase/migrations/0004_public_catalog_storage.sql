drop policy if exists library_objects_select on storage.objects;

create policy library_objects_select on storage.objects
for select to anon, authenticated
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
