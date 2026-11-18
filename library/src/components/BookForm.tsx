import { useState, type FormEvent } from 'react';
import { useLibrary } from '../app/LibraryContext';
import { categories } from '../lib/categories';
import type { Book } from '../types';
import { Icon } from './Icon';

export function BookForm({ book, onClose, onSaved }: { book?: Book; onClose: () => void; onSaved: (id: string) => void }) {
  const { addBook, updateBook, isAdmin } = useLibrary();
  const [title, setTitle] = useState(book?.title ?? '');
  const [author, setAuthor] = useState(book?.author ?? '');
  const [description, setDescription] = useState(book?.description ?? '');
  const [category, setCategory] = useState(book?.category ?? 'civil-law');
  const [year, setYear] = useState(book?.year?.toString() ?? '');
  const [keywords, setKeywords] = useState(book?.keywords.join(', ') ?? '');
  const [published, setPublished] = useState(book?.published ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(book?.coverUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!book && !file) {
      setError('Выберите PDF-файл книги');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let pageCount = book?.pageCount ?? 1;
      if (file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Допускаются только PDF-файлы');
        if (file.size > 100 * 1024 * 1024) throw new Error('Размер PDF не должен превышать 100 МБ');
        const [{ getDocument, GlobalWorkerOptions }, { default: workerUrl }] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
        GlobalWorkerOptions.workerSrc = workerUrl;
        const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
        pageCount = pdf.numPages;
        await pdf.destroy();
      }
      if (cover && cover.size > 5 * 1024 * 1024) throw new Error('Размер обложки не должен превышать 5 МБ');
      const draft = { title: title.trim(), author: author.trim(), description: description.trim(), category, year: year ? Number(year) : null, keywords: keywords.split(',').map((item) => item.trim()).filter(Boolean), published };
      const bookId = book ? (await updateBook(book.id, draft, file, cover, pageCount), book.id) : await addBook(draft, file as File, cover, pageCount);
      onSaved(bookId);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить книгу');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}>
      <section className="modal book-form-modal" role="dialog" aria-modal="true" aria-labelledby="book-form-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button>
        <p className="eyebrow">{book ? 'Карточка книги' : 'Новое издание'}</p>
        <h2 id="book-form-title">{book ? 'Редактировать книгу' : 'Добавить в библиотеку'}</h2>
        <form onSubmit={submit} className="book-form">
          <div className="form-grid">
            <label className="wide">Название<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={300} placeholder="Название книги или документа" /></label>
            <label>Автор<input value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={300} placeholder="Фамилия, имя" /></label>
            <label>Год издания<input type="number" min="1000" max="9999" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2026" /></label>
            <label className="wide">Категория<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
            <label className="wide">Описание<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="О чём эта книга?" /></label>
            <label className="wide">Ключевые слова<input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="договор, ответственность, ГК РФ" /></label>
          </div>
          <div className="file-inputs">
            <label className="file-drop"><Icon name="upload" /><span>{file ? file.name : book ? 'Заменить PDF (необязательно)' : 'Выбрать PDF'}</span><small>до 100 МБ</small><input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
            <label className="file-drop cover-drop">{coverPreview ? <img src={coverPreview} alt="Предпросмотр обложки" /> : <Icon name="upload" />}<span>{cover ? cover.name : 'Добавить обложку'}</span><small>JPG, PNG или WebP</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const selected = event.target.files?.[0] ?? null; setCover(selected); if (selected) setCoverPreview(URL.createObjectURL(selected)); }} /></label>
          </div>
          {(!book || isAdmin || book.owned) && <label className="checkbox-label"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /><span>Опубликовать книгу</span></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Отмена</button><button className="primary-button" disabled={busy}>{busy ? 'Сохранение…' : book ? 'Сохранить изменения' : 'Добавить книгу'}</button></div>
        </form>
      </section>
    </div>
  );
}
