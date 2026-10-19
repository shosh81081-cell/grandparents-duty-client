import { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'

const PAGE_SIZE = 7

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SlotsPage({ session, onUnauthorized }) {
  const [page, setPage] = useState(1)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [data, setData] = useState(null)
  const [message, setMessage] = useState(null) // { type: 'success' | 'conflict' | 'error', text }
  const isGrandchild = session.user.role === 'Grandchild'

  // pagination אמיתי: השרת מחזיר רק את העמוד המבוקש
  const load = useCallback(async () => {
    const params = new URLSearchParams({ page, pageSize: PAGE_SIZE, from: todayIso() })
    if (onlyOpen) params.set('status', 'Open')
    try {
      setData(await api(`/api/duty-slots?${params}`, { token: session.token }))
    } catch (err) {
      if (err.status === 401) onUnauthorized()
      else setMessage({ type: 'error', text: err.message })
    }
  }, [page, onlyOpen, session.token, onUnauthorized])

  useEffect(() => { load() }, [load])

  const showError = (err) => {
    if (err.status === 401) return onUnauthorized()
    // 409 - התורנות נתפסה. זה המקרה החשוב להציג בבירור
    if (err.status === 409) setMessage({ type: 'conflict', text: err.message })
    else setMessage({ type: 'error', text: err.message })
  }

  const claim = async (slot) => {
    setMessage(null)
    try {
      await api('/api/assignments', { method: 'POST', token: session.token, body: { dutySlotId: slot.id } })
      setMessage({ type: 'success', text: `התורנות של יום ${slot.dayName} נרשמה עליך. תזכו למצוות!` })
    } catch (err) {
      showError(err)
    }
    load()
  }

  // הדגמה: שתי בקשות נשלחות באותו רגע על אותה תורנות. רק אחת מצליחה, השנייה מקבלת 409
  const raceDemo = async (slot) => {
    setMessage(null)
    const send = () => api('/api/assignments', { method: 'POST', token: session.token, body: { dutySlotId: slot.id } })
    const results = await Promise.allSettled([send(), send()])
    const ok = results.filter(r => r.status === 'fulfilled').length
    const conflicts = results.filter(r => r.status === 'rejected' && r.reason.status === 409)
    setMessage({
      type: conflicts.length ? 'conflict' : 'success',
      text: `נשלחו 2 בקשות במקביל: ${ok} התקבלה, ${conflicts.length} נדחתה ב-409.` +
        (conflicts[0] ? ` הודעת השרת: "${conflicts[0].reason.message}"` : '')
    })
    load()
  }

  return (
    <section>
      <label className="inline">
        <input type="checkbox" checked={onlyOpen} onChange={e => { setPage(1); setOnlyOpen(e.target.checked) }} />
        רק תורנויות פנויות
      </label>

      {message && (
        <div className={`alert ${message.type}`}>
          {message.type === 'conflict' && <strong>התורנות כבר נתפסה (409). </strong>}
          {message.text}
        </div>
      )}

      {!data ? <p>טוען...</p> : (
        <>
          <table>
            <thead>
              <tr><th>יום</th><th>תאריך</th><th>תורנות</th><th>משימות</th><th>מי מגיע</th><th></th></tr>
            </thead>
            <tbody>
              {data.items.map(slot => (
                <tr key={slot.id} className={slot.requiresGranddaughter ? 'thursday' : ''}>
                  <td>{slot.dayName}</td>
                  <td>{slot.date.split('-').reverse().join('/')}</td>
                  <td>
                    {slot.title}
                    {slot.requiresGranddaughter && <span className="badge">נכדה</span>}
                  </td>
                  <td>{slot.helpTasks.map(t => t.name).join(', ')}</td>
                  <td>{slot.assignedTo ?? <span className="muted">פנוי</span>}</td>
                  <td>
                    {isGrandchild && slot.status === 'Open' && (
                      <>
                        <button onClick={() => claim(slot)}>אני מגיע/ה</button>
                        <button className="link small" onClick={() => raceDemo(slot)}>הדגמת תחרות</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pager">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>הקודם</button>
            <span>עמוד {data.page} מתוך {Math.max(data.totalPages, 1)}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>הבא</button>
          </div>
        </>
      )}
    </section>
  )
}
