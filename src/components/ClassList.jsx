import { useState } from 'react'

export default function ClassList({ classes, onSelect, onAdd, onDelete }) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

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
          <li key={cls.id} className="class-item" onClick={() => onSelect(cls.id)}>
            <div className="class-item-body">
              <span className="class-name">{cls.name}</span>
              <span className="class-count">{cls.entries.length} 件</span>
            </div>
            <button
              className="btn-danger-sm"
              onClick={e => { e.stopPropagation(); onDelete(cls.id) }}
            >削除</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
