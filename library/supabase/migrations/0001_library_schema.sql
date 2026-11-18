create type public.book_status as enum ('draft', 'published', 'archived');
create type public.highlight_kind as enum ('highlight', 'underline', 'strikeout');
create type public.highlight_color as enum ('yellow', 'green', 'red', 'blue', 'purple');
create type public.annotation_kind as enum ('note', 'comment', 'ink');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Читатель' check (char_length(display_name) between 1 and 100),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.keywords_to_search_text(keywords text[])
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(array_to_string(keywords, ' '), '');
$$;

create table public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  author text check (author is null or char_length(author) <= 300),
  description text,
  publication_year smallint check (publication_year between 1000 and 9999),
  keywords text[] not null default '{}',
  file_path text,
  file_name text,
  cover_path text,
  page_count integer check (page_count > 0),
  status public.book_status not null default 'draft',
  search_vector tsvector generated always as (
    setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('russian', public.keywords_to_search_text(keywords)), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_book_has_file check (status <> 'published' or file_path is not null)
);

create unique index books_file_path_key on public.books(file_path) where file_path is not null;
create unique index books_cover_path_key on public.books(cover_path) where cover_path is not null;
create index books_search_idx on public.books using gin(search_vector);
create index books_catalog_idx on public.books(status, created_at desc) where owner_id is null;
create index books_owner_idx on public.books(owner_id, created_at desc) where owner_id is not null;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique check (char_length(btrim(name)) between 1 and 150),
  description text,
  created_at timestamptz not null default now()
);

create table public.book_categories (
  book_id uuid not null references public.books(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  primary key (book_id, category_id)
);

create index book_categories_category_idx on public.book_categories(category_id, book_id);

create table public.library_entries (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create index library_entries_book_idx on public.library_entries(book_id, user_id);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table public.reading_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  current_page integer not null default 1 check (current_page > 0),
  percent numeric(5,2) not null default 0 check (percent between 0 and 100),
  last_read_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create index reading_progress_recent_idx on public.reading_progress(user_id, last_read_at desc);

create table public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  opened_at timestamptz not null default now(),
  last_page integer check (last_page > 0)
);

create index reading_history_user_idx on public.reading_history(user_id, opened_at desc);
create index reading_history_book_idx on public.reading_history(book_id, opened_at desc);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  title text check (title is null or char_length(title) <= 300),
  created_at timestamptz not null default now(),
  unique (user_id, book_id, page_number)
);

create index bookmarks_book_idx on public.bookmarks(user_id, book_id, page_number);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  kind public.highlight_kind not null default 'highlight',
  color public.highlight_color not null default 'yellow',
  selected_text text not null check (char_length(btrim(selected_text)) > 0),
  text_before text,
  text_after text,
  rects jsonb not null check (jsonb_typeof(rects) = 'array' and jsonb_array_length(rects) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id, book_id, page_number)
);

create index highlights_book_idx on public.highlights(user_id, book_id, page_number);
create index highlights_recent_idx on public.highlights(user_id, updated_at desc);

create table public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  highlight_id uuid,
  page_number integer not null check (page_number > 0),
  kind public.annotation_kind not null,
  content text,
  strokes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint annotations_highlight_match foreign key (highlight_id, user_id, book_id, page_number)
    references public.highlights(id, user_id, book_id, page_number) on delete cascade,
  constraint annotation_payload check (
    (kind = 'ink' and strokes is not null and jsonb_typeof(strokes) = 'array')
    or
    (kind in ('note', 'comment') and coalesce(char_length(btrim(content)), 0) > 0)
  )
);

create index annotations_book_idx on public.annotations(user_id, book_id, page_number);
create index annotations_recent_idx on public.annotations(user_id, updated_at desc);
create index annotations_highlight_idx on public.annotations(highlight_id) where highlight_id is not null;

create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text not null check (char_length(btrim(query)) between 1 and 300),
  searched_at timestamptz not null default now()
);

create index search_history_user_idx on public.search_history(user_id, searched_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger books_set_updated_at before update on public.books
for each row execute function public.set_updated_at();
create trigger highlights_set_updated_at before update on public.highlights
for each row execute function public.set_updated_at();
create trigger annotations_set_updated_at before update on public.annotations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Читатель'
    ), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.categories enable row level security;
alter table public.book_categories enable row level security;
alter table public.library_entries enable row level security;
alter table public.favorites enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_history enable row level security;
alter table public.bookmarks enable row level security;
alter table public.highlights enable row level security;
alter table public.annotations enable row level security;
alter table public.search_history enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy books_select_visible on public.books
for select to anon, authenticated
using (
  (owner_id is null and status = 'published')
  or owner_id = (select auth.uid())
  or public.is_admin()
);
create policy books_insert_allowed on public.books
for insert to authenticated
with check (owner_id = (select auth.uid()) or public.is_admin());
create policy books_update_allowed on public.books
for update to authenticated
using (owner_id = (select auth.uid()) or public.is_admin())
with check (owner_id = (select auth.uid()) or public.is_admin());
create policy books_delete_allowed on public.books
for delete to authenticated
using (owner_id = (select auth.uid()) or public.is_admin());

create policy categories_select_all on public.categories
for select to anon, authenticated using (true);
create policy categories_insert_admin on public.categories
for insert to authenticated with check (public.is_admin());
create policy categories_update_admin on public.categories
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy categories_delete_admin on public.categories
for delete to authenticated using (public.is_admin());

create policy book_categories_select_visible on public.book_categories
for select to anon, authenticated
using (exists (select 1 from public.books where books.id = book_id));
create policy book_categories_insert_allowed on public.book_categories
for insert to authenticated
with check (
  exists (
    select 1 from public.books
    where books.id = book_id
      and (books.owner_id = (select auth.uid()) or public.is_admin())
  )
);
create policy book_categories_delete_allowed on public.book_categories
for delete to authenticated
using (
  exists (
    select 1 from public.books
    where books.id = book_id
      and (books.owner_id = (select auth.uid()) or public.is_admin())
  )
);

create policy library_entries_select_own on public.library_entries
for select to authenticated using ((select auth.uid()) = user_id);
create policy library_entries_insert_own on public.library_entries
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.books where books.id = book_id)
);
create policy library_entries_delete_own on public.library_entries
for delete to authenticated using ((select auth.uid()) = user_id);

create policy favorites_select_own on public.favorites
for select to authenticated using ((select auth.uid()) = user_id);
create policy favorites_insert_own on public.favorites
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.books where books.id = book_id)
);
create policy favorites_delete_own on public.favorites
for delete to authenticated using ((select auth.uid()) = user_id);

create policy reading_progress_select_own on public.reading_progress
for select to authenticated using ((select auth.uid()) = user_id);
create policy reading_progress_insert_own on public.reading_progress
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.books where books.id = book_id)
);
create policy reading_progress_update_own on public.reading_progress
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy reading_progress_delete_own on public.reading_progress
for delete to authenticated using ((select auth.uid()) = user_id);

create policy reading_history_select_own on public.reading_history
for select to authenticated using ((select auth.uid()) = user_id);
create policy reading_history_insert_own on public.reading_history
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.books where books.id = book_id)
);
create policy reading_history_update_own on public.reading_history
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy reading_history_delete_own on public.reading_history
for delete to authenticated using ((select auth.uid()) = user_id);

create policy bookmarks_select_own on public.bookmarks
for select to authenticated using ((select auth.uid()) = user_id);
create policy bookmarks_insert_own on public.bookmarks
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.books where books.id = book_id)
);
create policy bookmarks_update_own on public.bookmarks
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy bookmarks_delete_own on public.bookmarks
for delete to authenticated using ((select auth.uid()) = user_id);

create policy highlights_select_own on public.highlights
for select to authenticated using ((select auth.uid()) = user_id);
create policy highlights_insert_own on public.highlights
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.books where books.id = book_id)
);
create policy highlights_update_own on public.highlights
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy highlights_delete_own on public.highlights
for delete to authenticated using ((select auth.uid()) = user_id);

create policy annotations_select_own on public.annotations
for select to authenticated using ((select auth.uid()) = user_id);
create policy annotations_insert_own on public.annotations
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.books where books.id = book_id)
);
create policy annotations_update_own on public.annotations
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy annotations_delete_own on public.annotations
for delete to authenticated using ((select auth.uid()) = user_id);

create policy search_history_select_own on public.search_history
for select to authenticated using ((select auth.uid()) = user_id);
create policy search_history_insert_own on public.search_history
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy search_history_delete_own on public.search_history
for delete to authenticated using ((select auth.uid()) = user_id);

grant select on public.books, public.categories, public.book_categories to anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.books to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.book_categories to authenticated;
grant select, insert, update, delete on public.library_entries, public.favorites to authenticated;
grant select, insert, update, delete on public.reading_progress, public.reading_history to authenticated;
grant select, insert, update, delete on public.bookmarks, public.highlights, public.annotations to authenticated;
grant select, insert, update, delete on public.search_history to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
