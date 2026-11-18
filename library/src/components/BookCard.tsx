import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../app/LibraryContext';
import { categoryName } from '../lib/categories';
import type { Book, ViewMode } from '../types';
import { BookForm } from './BookForm';
import { Icon } from './Icon';

export function BookCover({ book }: { book: Book }) {
  return (
    <div className={`book-cover tone-${book.id.charCodeAt(0) % 5}`}>
      {book.coverUrl ? <img src={book.coverUrl} alt={`Обложка: ${book.title}`} /> : <><span className="cover-brand">БОРЬБА УМОВ</span><strong>{book.title}</strong><span>{book.author || 'Юридическая библиотека'}</span><i /></>}
    </div>
  );
}

export function BookCard({ book, view, onChange }: { book: Book; view: ViewMode; onChange: () => void }) {
  const navigate = useNavigate();
  const { state, toggleFavorite, deleteBook, user, isAdmin } = useLibrary();
  const [editing, setEditing] = useState(false);
  const favorite = state.favorites.includes(book.id);
  const progress = state.progress[book.id];

  async function remove() {
    if (window.confirm(`Удалить «${book.title}» вместе с заметками и прогрессом?`)) {
      await deleteBook(book.id);
      onChange();
    }
  }

  return (
    <>
      <article className={`book-card ${view === 'list' ? 'book-list-card' : ''}`}>
        <button className="book-open" onClick={() => navigate(`/book/${book.id}`)} aria-label={`Открыть ${book.title}`}>
          <BookCover book={book} />
          <div className="book-info">
            <span className="book-category">{categoryName(book.category)}</span>
            <h3>{book.title}</h3>
            <p>{book.author || 'Автор не указан'}</p>
            {view === 'list' && <p className="book-description">{book.description || 'Описание не добавлено.'}</p>}
            <div className="book-meta"><span>{book.pageCount} стр.</span>{book.year && <span>{book.year}</span>}<span>{progress ? `${progress.percent}% прочитано` : 'Не начата'}</span></div>
            {progress && <div className="progress-track"><i style={{ width: `${progress.percent}%` }} /></div>}
          </div>
        </button>
        <button className={`icon-button favorite-button ${favorite ? 'active' : ''}`} onClick={() => void toggleFavorite(book.id)} aria-label={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}><Icon name="heart" fill={favorite ? 'currentColor' : 'none'} /></button>
        {(book.owned || isAdmin) && <div className="book-admin-actions"><button className="icon-button" onClick={() => setEditing(true)} aria-label="Редактировать"><Icon name="edit" /></button><button className="icon-button" onClick={() => void remove()} aria-label="Удалить"><Icon name="trash" /></button></div>}
      </article>
      {editing && <BookForm book={book} onClose={() => setEditing(false)} onSaved={() => { if (!user) onChange(); }} />}
    </>
  );
}
