import { useState } from 'react'
import { api } from './api.js'

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', gender: 'Female' })
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const auth = mode === 'login'
        ? await api('/api/tokens', { method: 'POST', body: { email: form.email, password: form.password } })
        : await api('/api/users', { method: 'POST', body: form })
      onLogin(auth)
    } catch (err) {
      const details = err.body?.errors ? Object.values(err.body.errors).flat().join(' · ') : ''
      setError(details || err.message)
    }
  }

  return (
    <div className="container narrow">
      <h1>תורנויות אצל סבא וסבתא</h1>
      <form onSubmit={submit} className="card">
        <h2>{mode === 'login' ? 'התחברות' : 'הרשמה'}</h2>

        {mode === 'register' && (
          <>
            <label>שם<input value={form.fullName} onChange={set('fullName')} required /></label>
            <label>
              אני
              <select value={form.gender} onChange={set('gender')}>
                <option value="Female">נכדה</option>
                <option value="Male">נכד</option>
              </select>
            </label>
          </>
        )}

        <label>אימייל<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>סיסמה<input type="password" value={form.password} onChange={set('password')} required /></label>

        {error && <div className="alert error">{error}</div>}

        <button type="submit">{mode === 'login' ? 'כניסה' : 'הרשמה'}</button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'אין לי משתמש - להרשמה' : 'יש לי משתמש - להתחברות'}
        </button>

        <p className="hint">לדוגמה: sara@family.local / Grand123!</p>
      </form>
    </div>
  )
}
