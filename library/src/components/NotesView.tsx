import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../app/LibraryContext';
import type { Annotation } from '../types';
import { Icon } from './Icon';

export function NotesView() {
  const { state, deleteBookmark, deleteHighlight, deleteAnnotation, updateAnnotation } = useLibrary();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'notes' | 'highlights' | 'bookmarks'>('notes');
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState('');

  const book = (bookId: string) => state.books.find((item) => item.id === bookId);
  const open = (bookId: string, page: number) => navigate(`/book/${bookId}?page=${page}&panel=notes`);

  function save(annotation: Annotation) {
    void updateAnnotation(annotation.id, text);
    setEditing(null);
  }

  return (
    <section className="notes-view">
      <div className="section-heading"><div><p className="eyebrow">Рабочий архив</p><h1>Мои заметки</h1><p>Выделения, комментарии и закладки из всех ваших книг.</p></div></div>
      <div className="tab-bar">
        <button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}><Icon name="notes" />Заметки <span>{state.annotations.filter((item) => item.kind !== 'ink').length}</span></button>
        <button className={tab === 'highlights' ? 'active' : ''} onClick={() => setTab('highlights')}><Icon name="highlighter" />Выделения <span>{state.highlights.length}</span></button>
        <button className={tab === 'bookmarks' ? 'active' : ''} onClick={() => setTab('bookmarks')}><Icon name="bookmark" />Закладки <span>{state.bookmarks.length}</span></button>
      </div>
      <div className="notes-list">
        {tab === 'notes' && state.annotations.filter((item) => item.kind !== 'ink').map((annotation) => <article className="note-card" key={annotation.id}>
          <div><span className={`note-kind ${annotation.kind}`}>{annotation.kind === 'note' ? 'Заметка' : 'Комментарий'}</span><time>{new Date(annotation.createdAt).toLocaleDateString('ru-RU')}</time></div>
          {editing === annotation.id ? <div className="note-edit"><textarea value={text} onChange={(event) => setText(event.target.value)} autoFocus /><button className="primary-button" onClick={() => save(annotation)}>Сохранить</button></div> : <p>{annotation.content}</p>}
          <footer><button onClick={() => open(annotation.bookId, annotation.page)}><strong>{book(annotation.bookId)?.title ?? 'Книга удалена'}</strong><span>Страница {annotation.page}</span></button><div><button className="icon-button" onClick={() => { setEditing(annotation.id); setText(annotation.content); }} aria-label="Редактировать"><Icon name="edit" /></button><button className="icon-button" onClick={() => void deleteAnnotation(annotation.id)} aria-label="Удалить"><Icon name="trash" /></button></div></footer>
        </article>)}
        {tab === 'highlights' && state.highlights.map((highlight) => <article className="note-card highlight-note" key={highlight.id}>
          <div><span className={`color-dot ${highlight.color}`} /><time>{new Date(highlight.createdAt).toLocaleDateString('ru-RU')}</time></div>
          <blockquote>{highlight.text}</blockquote>
          <footer><button onClick={() => open(highlight.bookId, highlight.page)}><strong>{book(highlight.bookId)?.title ?? 'Книга удалена'}</strong><span>Страница {highlight.page}</span></button><button className="icon-button" onClick={() => void deleteHighlight(highlight.id)} aria-label="Удалить"><Icon name="trash" /></button></footer>
        </article>)}
        {tab === 'bookmarks' && state.bookmarks.map((bookmark) => <article className="note-card bookmark-note" key={bookmark.id}>
          <Icon name="bookmark" />
          <button onClick={() => open(bookmark.bookId, bookmark.page)}><strong>{bookmark.title}</strong><span>{book(bookmark.bookId)?.title ?? 'Книга удалена'} · страница {bookmark.page}</span></button>
          <button className="icon-button" onClick={() => void deleteBookmark(bookmark.id)} aria-label="Удалить"><Icon name="trash" /></button>
        </article>)}
        {((tab === 'notes' && !state.annotations.some((item) => item.kind !== 'ink')) || (tab === 'highlights' && !state.highlights.length) || (tab === 'bookmarks' && !state.bookmarks.length)) && <div className="empty-state"><Icon name={tab === 'bookmarks' ? 'bookmark' : tab === 'highlights' ? 'highlighter' : 'notes'} /><h2>Здесь пока пусто</h2><p>Откройте книгу и используйте инструменты читалки — всё сохранится здесь автоматически.</p></div>}
      </div>
    </section>
  );
}
