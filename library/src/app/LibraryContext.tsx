import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { deleteFiles, getFile, loadLocalState, putFile, readFileAsDataUrl, saveLocalState } from '../lib/localStorage';
import type { Annotation, Book, BookDraft, Bookmark, Highlight, LibraryState, ReadingProgress } from '../types';

type BookRow = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  publication_year: number | null;
  keywords: string[];
  page_count: number | null;
  file_path: string | null;
  cover_path: string | null;
  created_at: string;
  status: 'draft' | 'published' | 'archived';
  owner_id: string | null;
  book_categories: { categories: { slug: string } | null }[];
};

type LibraryContextValue = {
  state: LibraryState;
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
  addBook: (draft: BookDraft, file: File, cover: File | null, pageCount: number) => Promise<string>;
  updateBook: (id: string, draft: BookDraft, file: File | null, cover: File | null, pageCount: number) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleLibrary: (id: string) => Promise<void>;
  updateProgress: (bookId: string, page: number, pageCount: number) => Promise<void>;
  recordOpen: (bookId: string, page: number) => Promise<void>;
  addBookmark: (bookId: string, page: number, title?: string) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  addHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => Promise<string>;
  deleteHighlight: (id: string) => Promise<void>;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => Promise<void>;
  updateAnnotation: (id: string, content: string) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  rememberSearch: (query: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  getBookFile: (book: Book) => Promise<Blob>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);
const id = () => crypto.randomUUID();

async function signedCover(path: string | null) {
  if (!path || !supabase) return null;
  const { data } = await supabase.storage.from('library-covers').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

async function mapBook(row: BookRow, userId: string): Promise<Book> {
  return {
    id: row.id,
    title: row.title,
    author: row.author ?? '',
    description: row.description ?? '',
    category: row.book_categories?.[0]?.categories?.slug ?? '',
    year: row.publication_year,
    keywords: row.keywords ?? [],
    pageCount: row.page_count ?? 1,
    coverUrl: await signedCover(row.cover_path),
    filePath: row.file_path,
    coverPath: row.cover_path,
    createdAt: row.created_at,
    published: row.status === 'published',
    owned: row.owner_id === userId,
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(loadLocalState);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.app_metadata.role === 'admin';

  const loadCloud = useCallback(async (currentUser: User | null) => {
    if (!supabase) return;
    setLoading(true);
    try {
      const booksResult = await supabase.from('books').select('*, book_categories(categories(slug))').order('created_at', { ascending: false });
      if (booksResult.error) throw booksResult.error;
      const books = await Promise.all(((booksResult.data ?? []) as unknown as BookRow[]).map((row) => mapBook(row, currentUser?.id ?? '')));

      if (!currentUser) {
        setState((current) => ({
          ...current,
          books: [...books, ...current.books.filter((book) => book.filePath?.startsWith('local:'))],
        }));
        return;
      }

      const [favoritesResult, libraryResult, progressResult, bookmarksResult, highlightsResult, annotationsResult, historyResult, profileResult] = await Promise.all([
        supabase.from('favorites').select('book_id'),
        supabase.from('library_entries').select('book_id'),
        supabase.from('reading_progress').select('*'),
        supabase.from('bookmarks').select('*').order('created_at', { ascending: false }),
        supabase.from('highlights').select('*').order('created_at', { ascending: false }),
        supabase.from('annotations').select('*').order('created_at', { ascending: false }),
        supabase.from('search_history').select('query').order('searched_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('display_name').eq('id', currentUser.id).single(),
      ]);
      const error = favoritesResult.error ?? libraryResult.error ?? progressResult.error ?? bookmarksResult.error ?? highlightsResult.error ?? annotationsResult.error ?? historyResult.error;
      if (error) throw error;
      const progress: Record<string, ReadingProgress> = {};
      (progressResult.data ?? []).forEach((row) => {
        progress[row.book_id] = { bookId: row.book_id, page: row.current_page, percent: Number(row.percent), lastReadAt: row.last_read_at };
      });
      setState({
        books,
        favorites: (favoritesResult.data ?? []).map((row) => row.book_id),
        library: (libraryResult.data ?? []).map((row) => row.book_id),
        progress,
        bookmarks: (bookmarksResult.data ?? []).map((row) => ({ id: row.id, bookId: row.book_id, page: row.page_number, title: row.title ?? '', createdAt: row.created_at })),
        highlights: (highlightsResult.data ?? []).map((row) => ({ id: row.id, bookId: row.book_id, page: row.page_number, kind: row.kind, color: row.color, text: row.selected_text, rects: row.rects as Highlight['rects'], createdAt: row.created_at })),
        annotations: (annotationsResult.data ?? []).map((row) => ({ id: row.id, bookId: row.book_id, page: row.page_number, highlightId: row.highlight_id ?? undefined, kind: row.kind, content: row.content ?? '', strokes: row.strokes as Annotation['strokes'], createdAt: row.created_at })),
        searchHistory: (historyResult.data ?? []).map((row) => row.query),
        displayName: profileResult.data?.display_name ?? currentUser.email?.split('@')[0] ?? 'Читатель',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const restore = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!active) return;
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);
        await loadCloud(currentUser);
      } catch {
        if (active) setLoading(false);
      }
    };
    void restore();
    return () => { active = false; };
  }, [loadCloud]);

  useEffect(() => {
    if (!user) saveLocalState({ ...state, books: state.books.filter((book) => book.filePath?.startsWith('local:')) });
  }, [state, user]);

  const requireCloud = () => {
    if (!supabase || !user) throw new Error('Для этого действия нужно войти в аккаунт');
    return { client: supabase, userId: user.id };
  };

  const addBook = useCallback(async (draft: BookDraft, file: File, cover: File | null, pageCount: number) => {
    const bookId = id();
    if (!user) {
      const filePath = `local:${bookId}:document`;
      await putFile(filePath, file);
      const coverUrl = cover ? await readFileAsDataUrl(cover) : null;
      const book: Book = { id: bookId, ...draft, pageCount, coverUrl, filePath, coverPath: null, createdAt: new Date().toISOString(), owned: true };
      setState((current) => ({ ...current, books: [book, ...current.books], library: [bookId, ...current.library] }));
      return bookId;
    }
    const { client, userId } = requireCloud();
    const filePath = isAdmin && !draft.published ? `catalog/${bookId}/document.pdf` : isAdmin ? `catalog/${bookId}/document.pdf` : `users/${userId}/${bookId}/document.pdf`;
    const { error } = await client.from('books').insert({ id: bookId, owner_id: isAdmin ? null : userId, title: draft.title, author: draft.author || null, description: draft.description, publication_year: draft.year, keywords: draft.keywords, file_path: filePath, page_count: pageCount, status: draft.published ? 'published' : 'draft' });
    if (error) throw error;
    const upload = await client.storage.from('library-documents').upload(filePath, file, { contentType: 'application/pdf' });
    if (upload.error) throw upload.error;
    let coverPath: string | null = null;
    if (cover) {
      const extension = cover.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      coverPath = `${isAdmin ? 'catalog' : `users/${userId}`}/${bookId}/cover.${extension}`;
      const result = await client.storage.from('library-covers').upload(coverPath, cover, { contentType: cover.type });
      if (result.error) throw result.error;
      await client.from('books').update({ cover_path: coverPath }).eq('id', bookId);
    }
    const category = draft.category ? await client.from('categories').select('id').eq('slug', draft.category).single() : null;
    if (category?.data) await client.from('book_categories').insert({ book_id: bookId, category_id: category.data.id });
    await loadCloud(user);
    return bookId;
  }, [isAdmin, loadCloud, user]);

  const updateBook = useCallback(async (bookId: string, draft: BookDraft, file: File | null, cover: File | null, pageCount: number) => {
    const existing = state.books.find((book) => book.id === bookId);
    if (!existing) return;
    if (!user) {
      if (file && existing.filePath) await putFile(existing.filePath, file);
      const coverUrl = cover ? await readFileAsDataUrl(cover) : existing.coverUrl;
      setState((current) => ({ ...current, books: current.books.map((book) => book.id === bookId ? { ...book, ...draft, pageCount, coverUrl } : book) }));
      return;
    }
    const { client } = requireCloud();
    const { error } = await client.from('books').update({ title: draft.title, author: draft.author || null, description: draft.description, publication_year: draft.year, keywords: draft.keywords, page_count: pageCount, status: draft.published ? 'published' : 'draft' }).eq('id', bookId);
    if (error) throw error;
    if (file && existing.filePath) {
      const result = await client.storage.from('library-documents').update(existing.filePath, file, { contentType: 'application/pdf', upsert: true });
      if (result.error) throw result.error;
    }
    if (cover) {
      const extension = cover.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const coverPath = `${existing.filePath?.split('/').slice(0, -1).join('/')}/cover.${extension}`;
      const result = await client.storage.from('library-covers').upload(coverPath, cover, { contentType: cover.type, upsert: true });
      if (result.error) throw result.error;
      await client.from('books').update({ cover_path: coverPath }).eq('id', bookId);
    }
    await client.from('book_categories').delete().eq('book_id', bookId);
    if (draft.category) {
      const category = await client.from('categories').select('id').eq('slug', draft.category).single();
      if (category.data) await client.from('book_categories').insert({ book_id: bookId, category_id: category.data.id });
    }
    await loadCloud(user);
  }, [loadCloud, state.books, user]);

  const deleteBook = useCallback(async (bookId: string) => {
    const book = state.books.find((item) => item.id === bookId);
    if (!book) return;
    if (!user) {
      await deleteFiles([book.filePath]);
      setState((current) => {
        const progress = { ...current.progress };
        delete progress[bookId];
        return { ...current, books: current.books.filter((item) => item.id !== bookId), favorites: current.favorites.filter((item) => item !== bookId), library: current.library.filter((item) => item !== bookId), progress, bookmarks: current.bookmarks.filter((item) => item.bookId !== bookId), highlights: current.highlights.filter((item) => item.bookId !== bookId), annotations: current.annotations.filter((item) => item.bookId !== bookId) };
      });
      return;
    }
    const { client } = requireCloud();
    if (book.filePath) await client.storage.from('library-documents').remove([book.filePath]);
    if (book.coverPath) await client.storage.from('library-covers').remove([book.coverPath]);
    const { error } = await client.from('books').delete().eq('id', bookId);
    if (error) throw error;
    await loadCloud(user);
  }, [loadCloud, state.books, user]);

  const toggleFavorite = useCallback(async (bookId: string) => {
    const active = state.favorites.includes(bookId);
    if (!user) {
      setState((current) => ({ ...current, favorites: active ? current.favorites.filter((item) => item !== bookId) : [...current.favorites, bookId] }));
      return;
    }
    const { client, userId } = requireCloud();
    const result = active ? await client.from('favorites').delete().eq('user_id', userId).eq('book_id', bookId) : await client.from('favorites').insert({ user_id: userId, book_id: bookId });
    if (result.error) throw result.error;
    setState((current) => ({ ...current, favorites: active ? current.favorites.filter((item) => item !== bookId) : [...current.favorites, bookId] }));
  }, [state.favorites, user]);

  const toggleLibrary = useCallback(async (bookId: string) => {
    const active = state.library.includes(bookId);
    if (!user) {
      setState((current) => ({ ...current, library: active ? current.library.filter((item) => item !== bookId) : [...current.library, bookId] }));
      return;
    }
    const { client, userId } = requireCloud();
    const result = active ? await client.from('library_entries').delete().eq('user_id', userId).eq('book_id', bookId) : await client.from('library_entries').insert({ user_id: userId, book_id: bookId });
    if (result.error) throw result.error;
    setState((current) => ({ ...current, library: active ? current.library.filter((item) => item !== bookId) : [...current.library, bookId] }));
  }, [state.library, user]);

  const updateProgress = useCallback(async (bookId: string, page: number, pageCount: number) => {
    const item: ReadingProgress = { bookId, page, percent: Math.min(100, Math.round((page / Math.max(pageCount, 1)) * 100)), lastReadAt: new Date().toISOString() };
    setState((current) => ({ ...current, progress: { ...current.progress, [bookId]: item }, library: current.library.includes(bookId) ? current.library : [...current.library, bookId] }));
    if (user && supabase) {
      await supabase.from('reading_progress').upsert({ user_id: user.id, book_id: bookId, current_page: page, percent: item.percent, last_read_at: item.lastReadAt });
      if (!state.library.includes(bookId)) await supabase.from('library_entries').insert({ user_id: user.id, book_id: bookId });
    }
  }, [state.library, user]);

  const recordOpen = useCallback(async (bookId: string, page: number) => {
    if (user && supabase) await supabase.from('reading_history').insert({ user_id: user.id, book_id: bookId, last_page: page });
  }, [user]);

  const addBookmark = useCallback(async (bookId: string, page: number, title = `Страница ${page}`) => {
    if (state.bookmarks.some((item) => item.bookId === bookId && item.page === page)) return;
    const bookmark: Bookmark = { id: id(), bookId, page, title, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, bookmarks: [bookmark, ...current.bookmarks] }));
    if (user && supabase) {
      const { data, error } = await supabase.from('bookmarks').insert({ user_id: user.id, book_id: bookId, page_number: page, title }).select('id').single();
      if (!error && data) setState((current) => ({ ...current, bookmarks: current.bookmarks.map((item) => item.id === bookmark.id ? { ...item, id: data.id } : item) }));
    }
  }, [state.bookmarks, user]);

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    setState((current) => ({ ...current, bookmarks: current.bookmarks.filter((item) => item.id !== bookmarkId) }));
    if (user && supabase) await supabase.from('bookmarks').delete().eq('id', bookmarkId);
  }, [user]);

  const addHighlight = useCallback(async (input: Omit<Highlight, 'id' | 'createdAt'>) => {
    const highlight: Highlight = { ...input, id: id(), createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, highlights: [highlight, ...current.highlights] }));
    if (user && supabase) {
      const { data } = await supabase.from('highlights').insert({ user_id: user.id, book_id: input.bookId, page_number: input.page, kind: input.kind, color: input.color, selected_text: input.text, rects: input.rects }).select('id').single();
      if (data) setState((current) => ({ ...current, highlights: current.highlights.map((item) => item.id === highlight.id ? { ...item, id: data.id } : item) }));
      return data?.id ?? highlight.id;
    }
    return highlight.id;
  }, [user]);

  const deleteHighlight = useCallback(async (highlightId: string) => {
    setState((current) => ({ ...current, highlights: current.highlights.filter((item) => item.id !== highlightId), annotations: current.annotations.filter((item) => item.highlightId !== highlightId) }));
    if (user && supabase) await supabase.from('highlights').delete().eq('id', highlightId);
  }, [user]);

  const addAnnotation = useCallback(async (input: Omit<Annotation, 'id' | 'createdAt'>) => {
    const annotation: Annotation = { ...input, id: id(), createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, annotations: [annotation, ...current.annotations] }));
    if (user && supabase) {
      const { data } = await supabase.from('annotations').insert({ user_id: user.id, book_id: input.bookId, page_number: input.page, highlight_id: input.highlightId ?? null, kind: input.kind, content: input.kind === 'ink' ? null : input.content, strokes: input.strokes ?? null }).select('id').single();
      if (data) setState((current) => ({ ...current, annotations: current.annotations.map((item) => item.id === annotation.id ? { ...item, id: data.id } : item) }));
    }
  }, [user]);

  const updateAnnotation = useCallback(async (annotationId: string, content: string) => {
    setState((current) => ({ ...current, annotations: current.annotations.map((item) => item.id === annotationId ? { ...item, content } : item) }));
    if (user && supabase) await supabase.from('annotations').update({ content }).eq('id', annotationId);
  }, [user]);

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    setState((current) => ({ ...current, annotations: current.annotations.filter((item) => item.id !== annotationId) }));
    if (user && supabase) await supabase.from('annotations').delete().eq('id', annotationId);
  }, [user]);

  const rememberSearch = useCallback(async (query: string) => {
    const normalized = query.trim();
    if (!normalized) return;
    setState((current) => ({ ...current, searchHistory: [normalized, ...current.searchHistory.filter((item) => item !== normalized)].slice(0, 10) }));
    if (user && supabase) await supabase.from('search_history').insert({ user_id: user.id, query: normalized });
  }, [user]);

  const clearSearchHistory = useCallback(async () => {
    setState((current) => ({ ...current, searchHistory: [] }));
    if (user && supabase) await supabase.from('search_history').delete().eq('user_id', user.id);
  }, [user]);

  const updateDisplayName = useCallback(async (name: string) => {
    setState((current) => ({ ...current, displayName: name }));
    if (user && supabase) await supabase.from('profiles').update({ display_name: name }).eq('id', user.id);
  }, [user]);

  const getBookFile = useCallback(async (book: Book) => {
    if (!book.filePath) throw new Error('PDF-файл не найден');
    if (book.filePath.startsWith('local:')) {
      const file = await getFile(book.filePath);
      if (!file) throw new Error('Локальный PDF-файл не найден');
      return file;
    }
    if (!supabase) throw new Error('Supabase не настроен');
    const { data, error } = await supabase.storage.from('library-documents').createSignedUrl(book.filePath, 3600);
    if (error || !data) throw error ?? new Error('Не удалось получить ссылку на PDF');
    const response = await fetch(data.signedUrl);
    if (!response.ok) throw new Error('Не удалось загрузить PDF');
    return response.blob();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Добавьте параметры Supabase в .env');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    await loadCloud(data.user);
  }, [loadCloud]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!supabase) throw new Error('Supabase не настроен');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (error) throw error;
    if (data.user && data.session) {
      setUser(data.user);
      await loadCloud(data.user);
      return true;
    }
    return false;
  }, [loadCloud]);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    setState(loadLocalState());
    await loadCloud(null);
  }, [loadCloud]);

  const value = useMemo(() => ({ state, loading, user, isAdmin, addBook, updateBook, deleteBook, toggleFavorite, toggleLibrary, updateProgress, recordOpen, addBookmark, deleteBookmark, addHighlight, deleteHighlight, addAnnotation, updateAnnotation, deleteAnnotation, rememberSearch, clearSearchHistory, updateDisplayName, getBookFile, signIn, signUp, signOut }), [state, loading, user, isAdmin, addBook, updateBook, deleteBook, toggleFavorite, toggleLibrary, updateProgress, recordOpen, addBookmark, deleteBookmark, addHighlight, deleteHighlight, addAnnotation, updateAnnotation, deleteAnnotation, rememberSearch, clearSearchHistory, updateDisplayName, getBookFile, signIn, signUp, signOut]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}
