import { useState } from 'react'

const DAYS = ['月', '火', '水', '木', '金', '土', '日']

function ScheduleEditor({ cls, onSave, onClose }) {
  const [day,   setDay]   = useState(cls.day_of_week  || '')
  const [start, setStart] = useState(cls.start_time   || '')
  const [end,   setEnd]   = useState(cls.end_time     || '')

  function handleSave() {
    onSave({ day_of_week: day || null, start_time: start || null, end_time: end || null })
    onClose()
  }

  function handleClear() {
    onSave({ day_of_week: null, start_time: null, end_time: null })
    onClose()
  }

  return (
    <div className="schedule-editor" onClick={e => e.stopPropagation()}>
      {/* 曜日 */}
      <div className="schedule-row">
        <span className="schedule-label">曜日</span>
        <div className="day-btns">
          {DAYS.map(d => (
            <button
              key={d}
              className={`day-btn${day === d ? ' day-btn--active' : ''}`}
              onClick={() => setDay(prev => prev === d ? '' : d)}
            >{d}</button>
          ))}
        </div>
      </div>
      {/* 時間 */}
      <div className="schedule-row">
        <span className="schedule-label">時間</span>
        <div className="time-inputs">
          <input
            type="time"
            className="time-input"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
          <span className="time-sep">〜</span>
          <input
            type="time"
            className="time-input"
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </div>
      </div>
      {/* アクション */}
      <div className="schedule-actions">
        <button className="btn-ghost btn-sm" onClick={handleClear}>クリア</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-ghost btn-sm" onClick={onClose}>キャンセル</button>
          <button className="btn-primary btn-sm" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

function ScheduleBadge({ cls }) {
  const { day_of_week: d, start_time: s, end_time: e } = cls
  if (!d && !s && !e) return null
  const parts = []
  if (d) parts.push(d)
  if (s || e) parts.push(`${s || '?'}〜${e || '?'}`)
  return <span className="schedule-badge">{parts.join(' ')}</span>
}

export default function ClassList({ classes, onSelect, onAdd, onDelete, onUpdate }) {
  const [newName, setNewName]         = useState('')
  const [adding, setAdding]           = useState(false)
  const [editingId, setEditingId]     = useState(null)   // どの授業のスケジュールを編集中か

  function submit(e) {
    e.preventDefault()
    if (!newName.trim()) return
    onAdd(newName.trim())
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>授業一覧</h1>
        <button className="btn-primary" onClick={() => setAdding(true)}>＋ 授業を追加</button>
      </header>

      {adding && (
        <form className="inline-form" onSubmit={submit}>
          <input
            autoFocus
            className="input"
            placeholder="例：現代中国語 第3回"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button className="btn-primary" type="submit">追加</button>
          <button className="btn-ghost" type="button" onClick={() => setAdding(false)}>キャンセル</button>
        </form>
      )}

      {classes.length === 0 && !adding && (
        <p className="empty">授業を追加してください</p>
      )}

      <ul className="class-list">
        {classes.map(cls => (
          <li key={cls.id} className="class-item-wrap">
            <div className="class-item" onClick={() => { setEditingId(null); onSelect(cls.id) }}>
              <div className="class-item-body">
                <div className="class-name-row">
                  <span className="class-name">{cls.name}</span>
                  <ScheduleBadge cls={cls} />
                </div>
                <span className="class-count">{cls.entries.length} 件</span>
              </div>
              <div className="class-item-actions">
                <button
                  className="btn-ghost btn-sm"
                  title="時間割を設定"
                  onClick={e => { e.stopPropagation(); setEditingId(prev => prev === cls.id ? null : cls.id) }}
                >
                  🗓
                </button>
                <button
                  className="btn-danger-sm"
                  onClick={e => { e.stopPropagation(); onDelete(cls.id) }}
                >削除</button>
              </div>
            </div>

            {editingId === cls.id && (
              <ScheduleEditor
                cls={cls}
                onSave={fields => onUpdate(cls.id, fields)}
                onClose={() => setEditingId(null)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
