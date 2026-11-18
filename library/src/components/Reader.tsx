import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useLibrary } from '../app/LibraryContext';
import type { Annotation, HighlightColor, HighlightKind, Rect } from '../types';
import { Icon } from './Icon';

GlobalWorkerOptions.workerSrc = workerUrl;

type Selection = { page: number; text: string; rects: Rect[] };
type Stroke = NonNullable<Annotation['strokes']>[number];

function PdfPage({ pdf, pageNumber, zoom, root, highlights, annotations, inkMode, onSelect, onInk }: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
  root: React.RefObject<HTMLDivElement | null>;
  highlights: { id: string; rects: Rect[]; kind: HighlightKind; color: HighlightColor }[];
  annotations: Annotation[];
  inkMode: boolean;
  onSelect: (selection: Selection) => void;
  onInk: (stroke: Stroke) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(pageNumber <= 2);
  const [drawing, setDrawing] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const element = pageRef.current;
    if (!element || near) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { root: root.current, rootMargin: '120% 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [near, root]);

  useEffect(() => {
    if (!near || !canvasRef.current || !textRef.current) return;
    let cancelled = false;
    let pdfPage: PDFPageProxy | null = null;
    const canvas = canvasRef.current;
    const textContainer = textRef.current;
    textContainer.replaceChildren();
    pdf.getPage(pageNumber).then(async (page) => {
      if (cancelled) return;
      pdfPage = page;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (760 * zoom) / base.width });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      pageRef.current?.style.setProperty('--page-ratio', `${base.width / base.height}`);
      const context = canvas.getContext('2d');
      if (!context) return;
      await page.render({ canvas, canvasContext: context, viewport, transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined }).promise;
      if (cancelled) return;
      textContainer.style.setProperty('--scale-factor', `${viewport.scale}`);
      const textLayer = new TextLayer({ textContentSource: page.streamTextContent(), container: textContainer, viewport });
      await textLayer.render();
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      pdfPage?.cleanup();
    };
  }, [near, pdf, pageNumber, zoom]);

  function selectText() {
    if (inkMode) return;
    const selection = window.getSelection();
    const bounds = pageRef.current?.getBoundingClientRect();
    if (!selection || selection.isCollapsed || !bounds || !selection.toString().trim()) return;
    const range = selection.getRangeAt(0);
    if (!pageRef.current?.contains(range.commonAncestorContainer)) return;
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 1 && rect.height > 1).map((rect) => ({ x: (rect.left - bounds.left) / bounds.width, y: (rect.top - bounds.top) / bounds.height, width: rect.width / bounds.width, height: rect.height / bounds.height }));
    if (rects.length) onSelect({ page: pageNumber, text: selection.toString().trim(), rects });
  }

  function point(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
  }

  function startInk(event: ReactPointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawing([point(event)]);
  }

  function moveInk(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drawing.length) return;
    const nextPoint = point(event);
    setDrawing((current) => [...current, nextPoint]);
  }

  function endInk() {
    if (drawing.length > 1) onInk({ color: '#d7ad55', points: drawing });
    setDrawing([]);
  }

  const ink = annotations.filter((item) => item.kind === 'ink');
  return (
    <div className={`pdf-page ${near ? '' : 'pdf-placeholder'}`} ref={pageRef} data-page={pageNumber} style={{ width: `${760 * zoom}px` }}>
      <canvas ref={canvasRef} />
      <div className="text-layer" ref={textRef} onMouseUp={selectText} />
      <div className="highlight-layer">
        {highlights.map((highlight) => highlight.rects.map((rect, index) => <i key={`${highlight.id}-${index}`} className={`pdf-highlight ${highlight.kind} ${highlight.color}`} style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.width * 100}%`, height: `${rect.height * 100}%` }} />))}
      </div>
      <svg className={`ink-layer ${inkMode ? 'active' : ''}`} viewBox="0 0 1 1" preserveAspectRatio="none" onPointerDown={inkMode ? startInk : undefined} onPointerMove={inkMode ? moveInk : undefined} onPointerUp={inkMode ? endInk : undefined} onPointerCancel={() => setDrawing([])}>
        {ink.flatMap((annotation) => annotation.strokes ?? []).map((stroke, index) => <polyline key={index} points={stroke.points.map((item) => `${item.x},${item.y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth="0.003" vectorEffect="non-scaling-stroke" />)}
        {drawing.length > 0 && <polyline points={drawing.map((item) => `${item.x},${item.y}`).join(' ')} fill="none" stroke="#d7ad55" strokeWidth="0.003" vectorEffect="non-scaling-stroke" />}
      </svg>
      <span className="page-number-label">{pageNumber}</span>
    </div>
  );
}

function PdfThumbnail({ pdf, pageNumber, active, onClick }: { pdf: PDFDocumentProxy; pageNumber: number; active: boolean; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = buttonRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    let cancelled = false;
    pdf.getPage(pageNumber).then(async (page) => {
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 84 / base.width });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) await page.render({ canvas, canvasContext: context, viewport }).promise;
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [pdf, pageNumber, visible]);
  return <button ref={buttonRef} className={`thumbnail ${active ? 'active' : ''}`} onClick={onClick}><canvas ref={canvasRef} /><span>{pageNumber}</span></button>;
}

export function Reader() {
  const { bookId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, loading, getBookFile, updateProgress, recordOpen, addBookmark, deleteBookmark, addHighlight, deleteHighlight, addAnnotation, updateAnnotation, deleteAnnotation } = useLibrary();
  const book = state.books.find((item) => item.id === bookId);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || state.progress[bookId]?.page || 1));
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [zoom, setZoom] = useState(() => window.innerWidth < 700 ? Math.max(0.4, (window.innerWidth - 24) / 760) : 1);
  const [thumbnails, setThumbnails] = useState(true);
  const [panel, setPanel] = useState(searchParams.get('panel') === 'notes');
  const [settings, setSettings] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [highlightKind, setHighlightKind] = useState<HighlightKind>('highlight');
  const [highlightColor, setHighlightColor] = useState<HighlightColor>('yellow');
  const [selectionNote, setSelectionNote] = useState('');
  const [inkMode, setInkMode] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ page: number; text: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<'notes' | 'search'>('notes');
  const scrollRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!book) return;
    let active = true;
    let document: PDFDocumentProxy | null = null;
    setError('');
    getBookFile(book).then((blob) => blob.arrayBuffer()).then((data) => getDocument({ data }).promise).then((loaded) => {
      if (!active) { void loaded.destroy(); return; }
      document = loaded;
      setPdf(loaded);
      const initial = Math.min(currentPage, loaded.numPages);
      setCurrentPage(initial);
      window.setTimeout(() => scrollRef.current?.querySelector(`[data-page="${initial}"]`)?.scrollIntoView(), 100);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Не удалось открыть PDF'));
    return () => { active = false; if (document) void document.destroy(); };
  }, [book?.id]);

  useEffect(() => {
    if (!pdf || !book || openedRef.current) return;
    openedRef.current = true;
    void recordOpen(book.id, currentPage);
  }, [pdf, book, currentPage, recordOpen]);

  useEffect(() => {
    if (!pdf || !book) return;
    const timer = window.setTimeout(() => void updateProgress(book.id, currentPage, pdf.numPages), 500);
    setPageInput(String(currentPage));
    return () => window.clearTimeout(timer);
  }, [currentPage, pdf?.numPages]);

  const goToPage = useCallback((page: number) => {
    if (!pdf) return;
    const normalized = Math.min(pdf.numPages, Math.max(1, page));
    setCurrentPage(normalized);
    scrollRef.current?.querySelector(`[data-page="${normalized}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pdf]);

  function updateVisiblePage() {
    const root = scrollRef.current;
    if (!root) return;
    const pages = Array.from(root.querySelectorAll<HTMLElement>('.pdf-page'));
    const nearest = pages.reduce<{ page: number; distance: number } | null>((best, element) => {
      const distance = Math.abs(element.getBoundingClientRect().top - root.getBoundingClientRect().top);
      return !best || distance < best.distance ? { page: Number(element.dataset.page), distance } : best;
    }, null);
    if (nearest && nearest.page !== currentPage) setCurrentPage(nearest.page);
  }

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if ((event.target as HTMLElement).matches('input, textarea, select')) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goToPage(currentPage + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goToPage(currentPage - 1); }
      if (event.key === 'Escape') { setSelection(null); setInkMode(false); }
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [currentPage, goToPage]);

  async function saveHighlight(withNote = false) {
    if (!selection || !book) return;
    const highlightId = await addHighlight({ bookId: book.id, page: selection.page, kind: highlightKind, color: highlightColor, text: selection.text, rects: selection.rects });
    if (withNote && selectionNote.trim()) await addAnnotation({ bookId: book.id, page: selection.page, highlightId, kind: 'comment', content: selectionNote.trim() });
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setSelectionNote('');
  }

  async function documentSearch(event: FormEvent) {
    event.preventDefault();
    if (!pdf || search.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const needle = search.trim().toLocaleLowerCase('ru');
    const results: { page: number; text: string }[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => 'str' in item ? item.str : '').join(' ');
      const index = text.toLocaleLowerCase('ru').indexOf(needle);
      if (index >= 0) results.push({ page: pageNumber, text: text.slice(Math.max(0, index - 45), index + needle.length + 65) });
      page.cleanup();
      if (results.length >= 100) break;
    }
    setSearchResults(results);
    setSearching(false);
  }

  function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!book || !noteText.trim()) return;
    if (editingNote) void updateAnnotation(editingNote, noteText.trim());
    else void addAnnotation({ bookId: book.id, page: currentPage, kind: 'note', content: noteText.trim() });
    setNoteText('');
    setEditingNote(null);
  }

  async function fullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await readerRef.current?.requestFullscreen();
  }

  if (!book) return loading
    ? <div className="reader-loading"><div className="spinner" /><p>Загружаем книгу…</p></div>
    : <div className="reader-message"><Icon name="book" /><h1>Книга не найдена</h1><button className="primary-button" onClick={() => navigate('/')}>Вернуться в библиотеку</button></div>;

  const bookBookmarks = state.bookmarks.filter((item) => item.bookId === book.id);
  const bookHighlights = state.highlights.filter((item) => item.bookId === book.id);
  const bookAnnotations = state.annotations.filter((item) => item.bookId === book.id);
  const bookmarked = bookBookmarks.some((item) => item.page === currentPage);

  return (
    <div className="reader" ref={readerRef}>
      <header className="reader-header">
        <button className="icon-button" onClick={() => navigate('/')} aria-label="Вернуться"><Icon name="arrowLeft" /></button>
        <div className="reader-book-title"><strong>{book.title}</strong><span>{book.author || 'Без автора'}</span></div>
        <div className="reader-page-control"><button className="icon-button" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}><Icon name="chevronLeft" /></button><form onSubmit={(event) => { event.preventDefault(); goToPage(Number(pageInput)); }}><input value={pageInput} onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ''))} inputMode="numeric" aria-label="Номер страницы" /><span>/ {pdf?.numPages ?? '—'}</span></form><button className="icon-button" disabled={currentPage >= (pdf?.numPages ?? 1)} onClick={() => goToPage(currentPage + 1)}><Icon name="chevronRight" /></button></div>
        <div className="reader-actions"><button className={`icon-button ${panel && panelTab === 'search' ? 'active' : ''}`} onClick={() => { setPanel(true); setPanelTab('search'); }} aria-label="Поиск по документу"><Icon name="search" /></button><button className={`icon-button ${bookmarked ? 'active gold' : ''}`} onClick={() => { const existing = bookBookmarks.find((item) => item.page === currentPage); if (existing) void deleteBookmark(existing.id); else void addBookmark(book.id, currentPage); }} aria-label="Закладка"><Icon name="bookmark" fill={bookmarked ? 'currentColor' : 'none'} /></button><button className={`icon-button ${panel && panelTab === 'notes' ? 'active' : ''}`} onClick={() => { setPanel(!panel || panelTab !== 'notes'); setPanelTab('notes'); }} aria-label="Заметки"><Icon name="notes" /></button><button className={`icon-button ${settings ? 'active' : ''}`} onClick={() => setSettings(!settings)} aria-label="Настройки"><Icon name="settings" /></button><button className="icon-button desktop-action" onClick={() => void fullscreen()} aria-label="Полный экран"><Icon name="expand" /></button></div>
      </header>

      {settings && <div className="reader-settings"><span>Масштаб</span><button className="icon-button" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}><Icon name="minus" /></button><b>{Math.round(zoom * 100)}%</b><button className="icon-button" onClick={() => setZoom(Math.min(2, zoom + 0.1))}><Icon name="plus" /></button><button className="secondary-button" onClick={() => setZoom(1)}>По размеру</button><button className={`secondary-button ${inkMode ? 'active-tool' : ''}`} onClick={() => setInkMode(!inkMode)}><Icon name="pen" />{inkMode ? 'Завершить пометки' : 'Рукописные пометки'}</button></div>}

      <div className="reader-body">
        <aside className={`thumbnail-panel ${thumbnails ? '' : 'collapsed'}`}><button className="thumbnail-toggle" onClick={() => setThumbnails(!thumbnails)} aria-label="Миниатюры"><Icon name={thumbnails ? 'chevronLeft' : 'chevronRight'} /></button>{thumbnails && pdf && <div className="thumbnail-list">{Array.from({ length: pdf.numPages }, (_, index) => <PdfThumbnail key={index + 1} pdf={pdf} pageNumber={index + 1} active={currentPage === index + 1} onClick={() => goToPage(index + 1)} />)}</div>}</aside>
        <div className="pdf-scroll" ref={scrollRef} onScroll={updateVisiblePage}>
          {error ? <div className="reader-message"><h2>Не удалось открыть документ</h2><p>{error}</p><button className="secondary-button" onClick={() => navigate('/')}>Назад</button></div> : !pdf ? <div className="reader-loading"><div className="spinner" /><p>Загружаем документ…</p></div> : <div className="pdf-pages">{Array.from({ length: pdf.numPages }, (_, index) => <PdfPage key={index + 1} pdf={pdf} pageNumber={index + 1} zoom={zoom} root={scrollRef} highlights={bookHighlights.filter((item) => item.page === index + 1)} annotations={bookAnnotations.filter((item) => item.page === index + 1)} inkMode={inkMode} onSelect={(value) => { setSelection(value); setSelectionNote(''); }} onInk={(stroke) => { if (book) void addAnnotation({ bookId: book.id, page: index + 1, kind: 'ink', content: '', strokes: [stroke] }); }} />)}</div>}
        </div>

        {panel && <aside className="reader-panel"><div className="reader-panel-header"><div className="panel-tabs"><button className={panelTab === 'notes' ? 'active' : ''} onClick={() => setPanelTab('notes')}>Заметки</button><button className={panelTab === 'search' ? 'active' : ''} onClick={() => setPanelTab('search')}>Поиск</button></div><button className="icon-button" onClick={() => setPanel(false)}><Icon name="close" /></button></div>
          {panelTab === 'search' ? <div className="document-search"><form onSubmit={documentSearch}><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Текст в документе" autoFocus /><button className="primary-button">Найти</button></form>{searching ? <div className="reader-loading"><div className="spinner" /><p>Ищем по страницам…</p></div> : <div className="search-results">{searchResults.map((result, index) => <button key={`${result.page}-${index}`} onClick={() => goToPage(result.page)}><span>Страница {result.page}</span><p>…{result.text}…</p></button>)}{search && !searching && !searchResults.length && <p className="muted">Введите запрос и нажмите «Найти». Если результатов нет, попробуйте другую формулировку.</p>}</div>}</div> : <div className="book-notes-panel">
            <form className="quick-note" onSubmit={submitNote}><label>{editingNote ? 'Редактировать заметку' : `Заметка к странице ${currentPage}`}</label><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Запишите мысль или важный тезис…" rows={3} /><div>{editingNote && <button type="button" className="text-button" onClick={() => { setEditingNote(null); setNoteText(''); }}>Отмена</button>}<button className="primary-button" disabled={!noteText.trim()}>{editingNote ? 'Сохранить' : 'Добавить'}</button></div></form>
            <div className="reader-notes-list">
              {bookBookmarks.map((item) => <div className="reader-note bookmark-row" key={item.id}><Icon name="bookmark" /><button onClick={() => goToPage(item.page)}><strong>{item.title}</strong><span>Закладка</span></button><button className="icon-button" onClick={() => void deleteBookmark(item.id)}><Icon name="trash" /></button></div>)}
              {bookAnnotations.map((item) => <div className="reader-note" key={item.id}><button onClick={() => goToPage(item.page)}><span>Страница {item.page} · {item.kind === 'note' ? 'Заметка' : item.kind === 'comment' ? 'Комментарий' : 'Рукописная пометка'}</span>{item.kind !== 'ink' && <p>{item.content}</p>}</button><div>{item.kind !== 'ink' && <button className="icon-button" onClick={() => { setEditingNote(item.id); setNoteText(item.content); }}><Icon name="edit" /></button>}<button className="icon-button" onClick={() => void deleteAnnotation(item.id)}><Icon name="trash" /></button></div></div>)}
              {bookHighlights.map((item) => <div className="reader-note" key={item.id}><button onClick={() => goToPage(item.page)}><span><i className={`color-dot ${item.color}`} />Страница {item.page}</span><blockquote>{item.text}</blockquote></button><button className="icon-button" onClick={() => void deleteHighlight(item.id)}><Icon name="trash" /></button></div>)}
              {!bookBookmarks.length && !bookAnnotations.length && !bookHighlights.length && <div className="panel-empty"><Icon name="notes" /><p>Выделяйте текст, добавляйте закладки и записывайте мысли. Всё появится здесь.</p></div>}
            </div>
          </div>}
        </aside>}
      </div>

      {selection && <div className="selection-toolbar"><div className="selection-main"><span className="selection-label">Страница {selection.page}</span><div className="kind-switch"><button className={highlightKind === 'highlight' ? 'active' : ''} onClick={() => setHighlightKind('highlight')}>Цвет</button><button className={highlightKind === 'underline' ? 'active' : ''} onClick={() => setHighlightKind('underline')}>Подчеркнуть</button><button className={highlightKind === 'strikeout' ? 'active' : ''} onClick={() => setHighlightKind('strikeout')}>Зачеркнуть</button></div><div className="color-palette">{(['yellow', 'green', 'red', 'blue', 'purple'] as HighlightColor[]).map((color) => <button key={color} className={`${color} ${highlightColor === color ? 'active' : ''}`} onClick={() => setHighlightColor(color)} aria-label={color} />)}</div><button className="primary-button" onClick={() => void saveHighlight()}><Icon name="highlighter" />Выделить</button><button className="icon-button" onClick={() => { window.getSelection()?.removeAllRanges(); setSelection(null); }}><Icon name="close" /></button></div><form onSubmit={(event) => { event.preventDefault(); void saveHighlight(true); }}><input value={selectionNote} onChange={(event) => setSelectionNote(event.target.value)} placeholder="Комментарий к выделению (необязательно)" /><button className="secondary-button" disabled={!selectionNote.trim()}>С комментарием</button></form></div>}
      <footer className="reader-footer"><span>Стр. {currentPage} из {pdf?.numPages ?? '—'}</span><div className="reader-position"><i style={{ width: `${pdf ? (currentPage / pdf.numPages) * 100 : 0}%` }} /></div><span>{Math.round(zoom * 100)}%</span></footer>
    </div>
  );
}
