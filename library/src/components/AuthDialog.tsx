import { useState, type FormEvent } from 'react';
import { isSupabaseConfigured } from '../services/supabase/client';
import { useLibrary } from '../app/LibraryContext';
import { Icon } from './Icon';

export function AuthDialog({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useLibrary();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (register) {
        const signedIn = await signUp(email, password, name);
        if (signedIn) onClose();
        else setRegistered(true);
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось выполнить вход');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button>
        <span className="brand-mark small">БУ</span>
        <p className="eyebrow">Личная библиотека</p>
        <h2 id="auth-title">{register ? 'Создать аккаунт' : 'С возвращением'}</h2>
        <p className="muted">Синхронизируйте книги, заметки и прогресс между устройствами.</p>
        {!isSupabaseConfigured ? (
          <div className="notice">Облачный вход станет доступен после добавления VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env. Локальный режим уже полностью доступен.</div>
        ) : registered ? (
          <div className="notice success">Проверьте почту для подтверждения аккаунта, затем войдите.</div>
        ) : (
          <form onSubmit={submit} className="stack-form">
            {register && <label>Имя<input value={name} onChange={(event) => setName(event.target.value)} required minLength={1} maxLength={100} placeholder="Ваше имя" /></label>}
            <label>Электронная почта<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="name@example.ru" /></label>
            <label>Пароль<input type="password" autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="Не менее 6 символов" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={busy}>{busy ? 'Подождите…' : register ? 'Зарегистрироваться' : 'Войти'}</button>
          </form>
        )}
        {isSupabaseConfigured && !registered && <button className="text-button auth-switch" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}</button>}
      </section>
    </div>
  );
}
