import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../app/LibraryContext';
import { BookCard } from './BookCard';
import { Icon } from './Icon';

export function ProfileView({ onAuth }: { onAuth: () => void }) {
  const { state, user, updateDisplayName, signOut } = useLibrary();
  const [name, setName] = useState(state.displayName);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const recent = [...Object.values(state.progress)].sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt)).slice(0, 3);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    void updateDisplayName(name.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="profile-view">
      <p className="eyebrow">Личное пространство</p>
      <div className="profile-hero"><div className="avatar">{state.displayName.slice(0, 1).toUpperCase()}</div><div><h1>{state.displayName}</h1><p>{user?.email ?? 'Локальная библиотека на этом устройстве'}</p></div>{user ? <button className="secondary-button" onClick={() => void signOut()}><Icon name="logout" />Выйти</button> : <button className="primary-button" onClick={onAuth}>Подключить облако</button>}</div>
      <div className="stats-grid"><div><strong>{state.library.length}</strong><span>Книг в библиотеке</span></div><div><strong>{state.highlights.length}</strong><span>Выделений</span></div><div><strong>{state.annotations.length}</strong><span>Заметок</span></div><div><strong>{state.bookmarks.length}</strong><span>Закладок</span></div></div>
      <div className="profile-columns">
        <form className="settings-card" onSubmit={submit}><h2>Настройки профиля</h2><label>Отображаемое имя<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required /></label><button className="primary-button">{saved ? 'Сохранено' : 'Сохранить'}</button><p className="muted">{user ? 'Данные синхронизируются через Supabase и защищены политиками доступа.' : 'Данные хранятся только в этом браузере. Войдите в аккаунт для синхронизации.'}</p></form>
        <div className="settings-card"><h2>История чтения</h2>{recent.length ? recent.map((progress) => { const book = state.books.find((item) => item.id === progress.bookId); return book ? <button className="history-row" key={progress.bookId} onClick={() => navigate(`/book/${book.id}`)}><Icon name="clock" /><span><strong>{book.title}</strong><small>Страница {progress.page} · {new Date(progress.lastReadAt).toLocaleDateString('ru-RU')}</small></span><b>{progress.percent}%</b></button> : null; }) : <p className="muted">Начните читать — здесь появится история.</p>}</div>
      </div>
      {recent.length > 0 && <div className="profile-recent"><h2>Недавно открытые</h2><div className="books-grid">{recent.map((progress) => { const book = state.books.find((item) => item.id === progress.bookId); return book ? <BookCard key={book.id} book={book} view="grid" onChange={() => undefined} /> : null; })}</div></div>}
    </section>
  );
}
