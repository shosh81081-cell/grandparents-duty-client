import { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'

export default function MyAssignmentsPage({ session, onUnauthorized }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [message, setMessage] = useState(null)
  const isCoordinator = session.user.role === 'Coordinator'

  const load = useCallback(async () => {
    try {
      setData(await api(`/api/assignments?page=${page}&pageSize=10&status=Active`, { token: session.token }))
    } catch (err) {
      if (err.status === 401) onUnauthorized()
      else setMessage(err.message)
    }
  }, [page, session.token, onUnauthorized])

  useEffect(() => { load() }, [load])

  const cancel = async (a) => {
    setMessage(null)
    try {
      await api(`/api/assignments/${a.id}`, { method: 'DELETE', token: session.token })
      setMessage(`השיבוץ של יום ${a.dayName} בוטל. התורנות חזרה להיות פנויה.`)
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setMessage(`${err.status}: ${err.message}`)
    }
    load()
  }

  if (!data) return <p>טוען...</p>

  return (
    <section>
      {message && <div className="alert">{message}</div>}
      {data.items.length === 0 ? <p>אין שיבוצים פעילים.</p> : (
        <table>
          <thead>
            <tr><th>יום</th><th>תאריך</th><th>תורנות</th>{isCoordinator && <th>מי</th>}<th></th></tr>
          </thead>
          <tbody>
            {data.items.map(a => (
              <tr key={a.id}>
                <td>{a.dayName}</td>
                <td>{a.date.split('-').reverse().join('/')}</td>
                <td>{a.slotTitle}</td>
                {isCoordinator && <td>{a.userName}</td>}
                <td><button className="link" onClick={() => cancel(a)}>ביטול</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>הקודם</button>
        <span>עמוד {data.page} מתוך {Math.max(data.totalPages, 1)}</span>
        <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>הבא</button>
      </div>
    </section>
  )
}
