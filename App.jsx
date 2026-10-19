import { useState } from 'react'
import AuthPage from './AuthPage.jsx'
import SlotsPage from './SlotsPage.jsx'
import MyAssignmentsPage from './MyAssignmentsPage.jsx'

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem('session'))
  } catch {
    return null
  }
}

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [tab, setTab] = useState('slots')

  const login = (auth) => {
    setSession(auth)
    try { localStorage.setItem('session', JSON.stringify(auth)) } catch { /* ignore */ }
  }

  const logout = () => {
    setSession(null)
    try { localStorage.removeItem('session') } catch { /* ignore */ }
  }

  if (!session) return <AuthPage onLogin={login} />

  const isCoordinator = session.user.role === 'Coordinator'

  return (
    <div className="container">
      <header>
        <h1>תורנויות אצל סבא וסבתא</h1>
        <div>
          שלום {session.user.fullName} ({isCoordinator ? 'רכזת' : session.user.gender === 'Female' ? 'נכדה' : 'נכד'})
          <button className="link" onClick={logout}>יציאה</button>
        </div>
      </header>

      <nav>
        <button className={tab === 'slots' ? 'active' : ''} onClick={() => setTab('slots')}>לוח התורנויות</button>
        <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
          {isCoordinator ? 'כל השיבוצים' : 'התורנויות שלי'}
        </button>
      </nav>

      {tab === 'slots'
        ? <SlotsPage session={session} onUnauthorized={logout} />
        : <MyAssignmentsPage session={session} onUnauthorized={logout} />}
    </div>
  )
}
