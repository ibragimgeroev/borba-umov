import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../app/LibraryContext';
import { categories, categoryName } from '../lib/categories';
import { isSupabaseConfigured } from '../services/supabase/client';
import type { LibrarySection, ViewMode } from '../types';
import { AuthDialog } from './AuthDialog';
import { BookCard, BookCover } from './BookCard';
import { BookForm } from './BookForm';
import { Icon } from './Icon';
import { NotesView } from './NotesView';
import { ProfileView } from './ProfileView';

const sectionTitles: Record<LibrarySection, { eyebrow: string; title: string; text: string }> = {
  catalog: { eyebrow: 'Знания меняют всё', title: 'Юридическая библиотека', text: 'Читайте, исследуйте и сохраняйте важное в одном пространстве.' },
  my: { eyebrow: 'Личная коллекция', title: 'Мои книги', text: 'Все книги, которые вы добавили или начали читать.' },
  favorites: { eyebrow: 'Отложенное на потом', title: 'Избранное', text: 'Ваши любимые книги и важные материалы всегда под рукой.' },
  notes: { eyebrow: '', title: '', text: '' },
  profile: { eyebrow: '', title: '', text: '' },
};

export function LibraryHome({ section }: { section: LibrarySection }) {
  const { state, loading, user, isAdmin, rememberSearch, clearSearchHistory } = useLibrary();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileCategories, setMobileCategories] = useState(false);

  const books = useMemo(() => {
    let items = state.books.filter((book) => book.published || book.owned || isAdmin);
    if (section === 'my') items = items.filter((book) => state.library.includes(book.id));
    if (section === 'favorites') items = items.filter((book) => state.favorites.includes(book.id));
    const needle = query.trim().toLocaleLowerCase('ru');
    if (needle) items = items.filter((book) => [book.title, book.author, book.description, categoryName(book.category), ...book.keywords].join(' ').toLocaleLowerCase('ru').includes(needle));
    if (category !== 'all') items = items.filter((book) => book.category === category);
    return [...items].sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'ru') : sort === 'author' ? a.author.localeCompare(b.author, 'ru') : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
  }, [state.books, state.library, state.favorites, section, query, category, sort, isAdmin]);

  const recentBooks = useMemo(() => Object.values(state.progress)
    .sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt))
    .map((progress) => state.books.find((book) => book.id === progress.bookId))
    .filter((book): book is NonNullable<typeof book> => Boolean(book))
    .slice(0, 4), [state.progress, state.books]);
  const continueBook = recentBooks[0];

  function search(event: FormEvent) {
    event.preventDefault();
    setSubmittedQuery(query);
    setSearchFocused(false);
    void rememberSearch(query);
  }

  function nav(target: LibrarySection) {
    setQuery('');
    setCategory('all');
    navigate(target === 'catalog' ? '/' : `/${target}`);
  }

  if (loading) return <div className="app-loading"><span className="brand-mark">БУ</span><div className="spinner" /><p>Открываем вашу библиотеку…</p></div>;

  return (
    <div className="library-app">
      <aside className="sidebar">
        <button className="brand" onClick={() => nav('catalog')}><span className="brand-mark">БУ</span><span><strong>БОРЬБА УМОВ</strong><small>Цифровая библиотека</small></span></button>
        <nav className="main-nav" aria-label="Основная навигация">
          <button className={section === 'catalog' ? 'active' : ''} onClick={() => nav('catalog')}><Icon name="grid" /><span>Каталог</span></button>
          <button className={section === 'my' ? 'active' : ''} onClick={() => nav('my')}><Icon name="book" /><span>Мои книги</span><b>{state.library.length || ''}</b></button>
          <button className={section === 'favorites' ? 'active' : ''} onClick={() => nav('favorites')}><Icon name="heart" /><span>Избранное</span></button>
          <button className={section === 'notes' ? 'active' : ''} onClick={() => nav('notes')}><Icon name="notes" /><span>Мои заметки</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="platform-link" onClick={() => window.location.assign('../../')}><Icon name="arrowLeft" /><span>На основную платформу</span></button>
          <div className="storage-note"><span className={user ? 'online-dot' : 'local-dot'} /><div><strong>{user ? 'Облачная библиотека' : 'Локальное хранение'}</strong><small>{user ? 'Данные синхронизированы' : 'Только на этом устройстве'}</small></div></div>
          <button className={`profile-link ${section === 'profile' ? 'active' : ''}`} onClick={() => nav('profile')}><span className="mini-avatar">{state.displayName.slice(0, 1).toUpperCase()}</span><span><strong>{state.displayName}</strong><small>{user?.email ?? 'Настройки профиля'}</small></span><Icon name="chevronRight" /></button>
        </div>
      </aside>

      <main className="library-main">
        <header className="topbar">
          <button className="icon-button platform-back" onClick={() => window.location.assign('../../')} aria-label="На основную платформу"><Icon name="arrowLeft" /></button>
          <button className="mobile-brand" onClick={() => nav('catalog')}><span className="brand-mark small">БУ</span></button>
          <form className="global-search" onSubmit={search}>
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)} placeholder="Название, автор или ключевые слова" aria-label="Поиск по библиотеке" />
            {query && <button type="button" className="icon-button" onClick={() => setQuery('')} aria-label="Очистить"><Icon name="close" /></button>}
            {searchFocused && !query && state.searchHistory.length > 0 && <div className="search-history"><div><span>Недавние запросы</span><button type="button" onMouseDown={() => void clearSearchHistory()}>Очистить</button></div>{state.searchHistory.map((item) => <button type="button" key={item} onMouseDown={() => { setQuery(item); setSubmittedQuery(item); setSearchFocused(false); }}><Icon name="clock" />{item}</button>)}</div>}
          </form>
          <button className="primary-button add-book-button" onClick={() => setShowForm(true)}><Icon name="plus" /><span>Добавить книгу</span></button>
          <button className="icon-button mobile-profile" onClick={() => nav('profile')} aria-label="Профиль"><Icon name="user" /></button>
        </header>

        <div className="content-wrap">
          {section === 'notes' ? <NotesView /> : section === 'profile' ? <ProfileView onAuth={() => setShowAuth(true)} /> : <>
            <div className="section-heading"><div><p className="eyebrow">{sectionTitles[section].eyebrow}</p><h1>{query ? 'Результаты поиска' : sectionTitles[section].title}</h1><p>{query ? `По запросу «${query}» найдено: ${books.length}` : sectionTitles[section].text}</p></div>{query && submittedQuery && <span className="search-saved"><Icon name="check" />Запрос сохранён</span>}</div>

            {section === 'catalog' && !query && continueBook && <section className="continue-card">
              <div className="continue-copy"><p className="eyebrow">Продолжить чтение</p><h2>{continueBook.title}</h2><p>{continueBook.author || 'Автор не указан'}</p><div className="continue-progress"><div className="progress-track"><i style={{ width: `${state.progress[continueBook.id]?.percent ?? 0}%` }} /></div><span>{state.progress[continueBook.id]?.percent ?? 0}%</span></div><button className="light-button" onClick={() => navigate(`/book/${continueBook.id}`)}>Продолжить <Icon name="chevronRight" /></button></div>
              <div className="continue-cover"><BookCover book={continueBook} /></div>
              <span className="continue-decoration">§</span>
            </section>}

            {section === 'catalog' && !query && recentBooks.length > 0 && <section className="recent-section" aria-labelledby="recent-books-title">
              <div className="recent-heading"><h2 id="recent-books-title">Недавно открытые</h2><span>{recentBooks.length} {recentBooks.length === 1 ? 'книга' : recentBooks.length < 5 ? 'книги' : 'книг'}</span></div>
              <div className="recent-books">{recentBooks.map((book) => <button className="recent-book" key={book.id} onClick={() => navigate(`/book/${book.id}`)} aria-label={`Продолжить чтение: ${book.title}`}>
                <BookCover book={book} />
                <span className="recent-book-info"><strong>{book.title}</strong><small>{book.author || 'Автор не указан'}</small><span className="recent-progress"><i style={{ width: `${state.progress[book.id]?.percent ?? 0}%` }} /></span><small>{state.progress[book.id]?.percent ?? 0}% прочитано</small></span>
              </button>)}</div>
            </section>}

            {section === 'catalog' && !query && <>
              <button className="category-mobile-toggle" onClick={() => setMobileCategories(!mobileCategories)}><Icon name="list" />Категории<Icon name={mobileCategories ? 'chevronLeft' : 'chevronRight'} /></button>
              <div className={`category-scroller ${mobileCategories ? 'open' : ''}`}><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>Все направления <span>{state.books.length}</span></button>{categories.map((item) => <button key={item.slug} className={category === item.slug ? 'active' : ''} onClick={() => setCategory(item.slug)}>{item.name}</button>)}</div>
            </>}

            <div className="catalog-toolbar"><div><h2>{query ? 'Книги' : category === 'all' ? section === 'catalog' ? 'Все издания' : sectionTitles[section].title : categoryName(category)}</h2><span>{books.length} {books.length === 1 ? 'книга' : books.length > 1 && books.length < 5 ? 'книги' : 'книг'}</span></div><div className="toolbar-controls"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Сортировка"><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="title">По названию</option><option value="author">По автору</option></select><div className="view-switch"><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Сетка"><Icon name="grid" /></button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="Список"><Icon name="list" /></button></div></div></div>

            {books.length ? <div className={view === 'grid' ? 'books-grid' : 'books-list'}>{books.map((book) => <BookCard key={book.id} book={book} view={view} onChange={() => undefined} />)}</div> : <div className="empty-state catalog-empty"><span className="empty-books"><Icon name={query ? 'search' : 'book'} /></span><h2>{query ? 'Ничего не найдено' : section === 'favorites' ? 'В избранном пока пусто' : 'Начните собирать библиотеку'}</h2><p>{query ? 'Попробуйте изменить запрос или выбрать другую категорию.' : 'Добавьте первый PDF-документ — вы сможете читать его, делать заметки и сохранять прогресс.'}</p>{!query && section !== 'favorites' && <button className="primary-button" onClick={() => setShowForm(true)}><Icon name="plus" />Добавить первую книгу</button>}{query && <button className="secondary-button" onClick={() => { setQuery(''); setCategory('all'); }}>Сбросить фильтры</button>}</div>}
          </>}
          <footer className="app-footer"><span>БОРЬБА УМОВ · Библиотека</span><span>{isSupabaseConfigured ? 'Supabase подключён' : 'Локальный режим'} · Ваши знания — ваше пространство</span></footer>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Мобильная навигация"><button className={section === 'catalog' ? 'active' : ''} onClick={() => nav('catalog')}><Icon name="grid" /><span>Каталог</span></button><button className={section === 'my' ? 'active' : ''} onClick={() => nav('my')}><Icon name="book" /><span>Книги</span></button><button className="mobile-add" onClick={() => setShowForm(true)}><Icon name="plus" /></button><button className={section === 'notes' ? 'active' : ''} onClick={() => nav('notes')}><Icon name="notes" /><span>Заметки</span></button><button className={section === 'favorites' ? 'active' : ''} onClick={() => nav('favorites')}><Icon name="heart" /><span>Избранное</span></button></nav>
      {showForm && <BookForm onClose={() => setShowForm(false)} onSaved={(bookId) => navigate(`/book/${bookId}`)} />}
      {showAuth && <AuthDialog onClose={() => setShowAuth(false)} />}
    </div>
  );
}
