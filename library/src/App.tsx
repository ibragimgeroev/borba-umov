import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LibraryHome } from './components/LibraryHome';

const Reader = lazy(() => import('./components/Reader').then((module) => ({ default: module.Reader })));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LibraryHome section="catalog" />} />
      <Route path="/my" element={<LibraryHome section="my" />} />
      <Route path="/favorites" element={<LibraryHome section="favorites" />} />
      <Route path="/notes" element={<LibraryHome section="notes" />} />
      <Route path="/profile" element={<LibraryHome section="profile" />} />
      <Route path="/book/:bookId" element={<Suspense fallback={<div className="reader-loading"><div className="spinner" /><p>Загружаем читалку…</p></div>}><Reader /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
