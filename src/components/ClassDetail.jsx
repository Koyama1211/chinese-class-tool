import { useState } from 'react'
import EntryForm from './EntryForm'

function buildSegments(entry) {
  const zh = (entry.chinese || '').split('\n')
  const py = (entry.pinyin || '').split('\n')
  const ja = (entry.japanese || '').split('\n')
  const len = Math.max(zh.length, py.length, ja.length)
  return Array.from({ length: len }, (_, i) => ({
    chinese: (zh[i] || '').trim(),
    pinyin: (py[i] || '').trim(),
    japanese: (ja[i] || '').trim(),
  })).filter(s => s.chinese || s.pinyin || s.japanese)
}

function SegmentView({ seg, onStartEdit }) {
  return (
    <div className="segment">
      <div className="segment-rows">
        {seg.chinese && (
          <div className="interlinear-row">
            <span className="lang-badge zh">中文</span>
            <p className="text-zh">{seg.chinese}</p>
          </div>
        )}
        {seg.pinyin && (
          <div className="interlinear-row">
            <span className="lang-badge py">拼音</span>
            <p className="text-py">{seg.pinyin}</p>
          </div>
        )}
        {seg.japanese && (
          <div className="interlinear-row">
            <span className="lang-badge ja">日本語</span>
            <p className="text-ja">{seg.japanese}</p>
          </div>
        )}
      </div>
      <div className="segment-footer">
        <button className="btn-correct" onClick={onStartEdit}>✏️ この文を修正</button>
      </div>
    </div>
  )
}

function SegmentEdit({ seg, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...seg })
  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }))

  return (
    <div className="segment segment-editing">
      <div className="segment-edit-field">
        <span className="lang-badge zh">中文</span>
        <input className="input seg-input zh-input" value={draft.chinese} onChange={e => set('chinese', e.target.value)} />
      </div>
      <div className="segment-edit-field">
        <span className="lang-badge py">拼音</span>
        <input className="input seg-input py-input" value={draft.pinyin} onChange={e => set('pinyin', e.target.value)} />
      </div>
      <div className="segment-edit-field">
        <span className="lang-badge ja">日本語</span>
        <input className="input seg-input ja-input" value={draft.japanese} onChange={e => set('japanese', e.target.value)} />
      </div>
      <div className="segment-edit-actions">
        <button className="btn-primary btn-sm" onClick={() => onSave(draft)}>保存</button>
        <button className="btn-ghost btn-sm" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  )
}

function EntryCard({ entry, onEdit, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [editingSegIdx, setEditingSegIdx] = useState(null)
  const segments = buildSegments(entry)

  function handleSegmentSave(index, updated) {
    const next = segments.map((s, i) => i === index ? updated : s)
    onUpdate({
      ...entry,
      chinese: next.map(s => s.chinese).join('\n'),
      pinyin: next.map(s => s.pinyin).join('\n'),
      japanese: next.map(s => s.japanese).join('\n'),
    })
    setEditingSegIdx(null)
  }

  return (
    <div className="entry-card">
      <div className="entry-header" onClick={() => setExpanded(e => !e)}>
        <span className="entry-label">{entry.label || '翻訳文'}</span>
        <div className="entry-header-actions">
          <button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onEdit() }}>全体編集</button>
          <button className="btn-danger-sm" onClick={e => { e.stopPropagation(); onDelete() }}>削除</button>
          <span className="chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="entry-body">
          {segments.map((seg, i) =>
            editingSegIdx === i ? (
              <SegmentEdit
                key={i}
                seg={seg}
                onSave={updated => handleSegmentSave(i, updated)}
                onCancel={() => setEditingSegIdx(null)}
              />
            ) : (
              <SegmentView
                key={i}
                seg={seg}
                onStartEdit={() => setEditingSegIdx(i)}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function ClassDetail({ cls, onBack, onAddEntry, onUpdateEntry, onDeleteEntry }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  function handleSave(form) {
    if (editingId) {
      onUpdateEntry(editingId, form)
      setEditingId(null)
    } else {
      onAddEntry(form)
      setShowForm(false)
    }
  }

  const editingEntry = editingId ? cls.entries.find(e => e.id === editingId) : null

  return (
    <div className="page">
      <header className="page-header">
        <button className="btn-back" onClick={onBack}>← 戻る</button>
        <h1>{cls.name}</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null) }}>＋ 追加</button>
      </header>

      {(showForm && !editingId) && (
        <div className="form-section">
          <h2 className="section-title">新しい翻訳文</h2>
          <EntryForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editingId && (
        <div className="form-section">
          <h2 className="section-title">全体編集</h2>
          <EntryForm initial={editingEntry} onSave={handleSave} onCancel={() => setEditingId(null)} />
        </div>
      )}

      {cls.entries.length === 0 && !showForm && (
        <p className="empty">翻訳文を追加してください</p>
      )}

      <div className="entry-list">
        {cls.entries.map(entry => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={() => { setEditingId(entry.id); setShowForm(false) }}
            onDelete={() => onDeleteEntry(entry.id)}
            onUpdate={updated => onUpdateEntry(entry.id, updated)}
          />
        ))}
      </div>
    </div>
  )
}
