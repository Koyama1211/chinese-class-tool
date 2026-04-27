import { useState, useEffect, useRef } from 'react'
import EntryForm from './EntryForm'

function buildSegments(entry) {
  const zh = (entry.chinese || '').split('\n')
  const py = (entry.pinyin || '').split('\n')
  const ja = (entry.japanese || '').split('\n')
  const len = Math.max(zh.length, py.length, ja.length)
  return Array.from({ length: len }, (_, i) => ({
    chinese:  (zh[i] || '').trim(),
    pinyin:   (py[i] || '').trim(),
    japanese: (ja[i] || '').trim(),
  })).filter(s => s.chinese || s.pinyin || s.japanese)
}

// ── しおり線 ──────────────────────────────────────────────────
function SegmentDivider({ pos, isActive, onTap }) {
  return (
    <div
      className={`seg-divider${isActive ? ' seg-divider--active' : ''}`}
      onClick={() => onTap(isActive ? null : pos)}
      title={isActive ? 'しおりを外す' : 'ここにしおりを挟む'}
    >
      {isActive && <span className="divider-label">今ここ</span>}
    </div>
  )
}

// ── セグメント（マージンノート付き） ─────────────────────────
function SegmentView({ seg, isPassed, onStartEdit, note, onNoteChange }) {
  const [localNote, setLocalNote] = useState(note || '')
  const [editing, setEditing]     = useState(false)

  useEffect(() => { setLocalNote(note || '') }, [note])

  const hasNote = !!localNote.trim()

  function handleBlur() {
    setEditing(false)
    if (localNote.trim() !== (note || '').trim()) {
      onNoteChange(localNote.trim())
    }
  }

  return (
    <div className={`segment${isPassed ? ' segment--passed' : ''}`}>

      {/* 本文行 */}
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

      {/* フッター */}
      <div className="segment-footer">
        <button className="btn-correct" onClick={onStartEdit}>✏️ 修正</button>
        {/* モバイル：ノート追加ボタン（未入力時のみ） */}
        {!hasNote && (
          <button className="btn-correct btn-note-add" onClick={() => setEditing(true)}>
            📝 メモ
          </button>
        )}
      </div>

      {/* マージンノート
          デスクトップ：position:absolute でカード右外に浮かぶ
          モバイル：ノート有のみ折りたたみ表示 */}
      <div className={`margin-note${hasNote ? ' has-note' : ''}`}>
        {editing ? (
          <textarea
            className="note-textarea"
            value={localNote}
            onChange={e => setLocalNote(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            placeholder="先生の解説・補足メモ..."
            rows={3}
          />
        ) : (
          <div
            className={`note-body${hasNote ? '' : ' note-empty'}`}
            onClick={() => setEditing(true)}
          >
            {hasNote ? localNote : '＋ メモ'}
          </div>
        )}
      </div>
    </div>
  )
}

// ── セグメント編集 ────────────────────────────────────────────
function SegmentEdit({ seg, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...seg })
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

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

// ── エントリーカード ──────────────────────────────────────────
function EntryCard({ entry, expanded, onToggle, bookmarkPos, onSetBookmark, onEdit, onDelete, onUpdate }) {
  const [editingSegIdx, setEditingSegIdx] = useState(null)
  const segments = buildSegments(entry)
  const hasBookmark = bookmarkPos !== null && bookmarkPos !== undefined
  const progress    = hasBookmark ? `${bookmarkPos} / ${segments.length} 文` : null

  function handleNoteChange(segIdx, text) {
    const next = { ...(entry.notes || {}) }
    if (text) next[String(segIdx)] = text
    else delete next[String(segIdx)]
    onUpdate({ notes: next })
  }

  function handleSegmentSave(index, updated) {
    const next = segments.map((s, i) => i === index ? updated : s)
    onUpdate({
      ...entry,
      chinese:  next.map(s => s.chinese).join('\n'),
      pinyin:   next.map(s => s.pinyin).join('\n'),
      japanese: next.map(s => s.japanese).join('\n'),
    })
    setEditingSegIdx(null)
  }

  return (
    <div className="entry-card">
      <div className="entry-header" onClick={onToggle}>
        <div className="entry-header-left">
          <span className="entry-label">{entry.label || '翻訳文'}</span>
          {progress && <span className="entry-progress-badge">{progress}</span>}
        </div>
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
                onSave={u => handleSegmentSave(i, u)}
                onCancel={() => setEditingSegIdx(null)}
              />
            ) : (
              <div key={i}>
                <SegmentView
                  seg={seg}
                  isPassed={hasBookmark && i < bookmarkPos}
                  onStartEdit={() => setEditingSegIdx(i)}
                  note={(entry.notes || {})[String(i)] || ''}
                  onNoteChange={t => handleNoteChange(i, t)}
                />
                {i < segments.length - 1 && (
                  <SegmentDivider
                    pos={i + 1}
                    isActive={bookmarkPos === i + 1}
                    onTap={onSetBookmark}
                  />
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── 授業タイマー ──────────────────────────────────────────────
const DAY_INDEX = { '日':0, '月':1, '火':2, '水':3, '木':4, '金':5, '土':6 }

function ClassTimer({ endTime, dayOfWeek }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!endTime) { setRemaining(null); return }

    function calc() {
      // 曜日が設定されていて今日と違う → 表示しない
      if (dayOfWeek && new Date().getDay() !== DAY_INDEX[dayOfWeek]) {
        setRemaining(null)
        return
      }
      const [h, m] = endTime.split(':').map(Number)
      const end = new Date()
      end.setHours(h, m, 0, 0)
      setRemaining(Math.round((end - Date.now()) / 60000))
    }

    calc()
    const id = setInterval(calc, 30000)
    return () => clearInterval(id)
  }, [endTime, dayOfWeek])

  if (!endTime || remaining === null) return null

  const done   = remaining <= 0
  const urgent = !done && remaining <= 10

  return (
    <div className={`timer-display${urgent ? ' timer-display--urgent' : ''}${done ? ' timer-display--done' : ''}`}>
      <span className="timer-icon">🕐</span>
      <span className="timer-label">{done ? '授業終了' : `あと ${remaining}分`}</span>
    </div>
  )
}

// ── ClassDetail ───────────────────────────────────────────────
export default function ClassDetail({ cls, onBack, onAddEntry, onUpdateEntry, onDeleteEntry }) {
  const [showForm,   setShowForm]   = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef(null)

  // 展開状態を ClassDetail で一元管理（全展開 / 全折り用）
  const [expandedIds, setExpandedIds] = useState(new Set())

  // しおり → Supabase の entries.bookmark_pos に保存
  function handleSetBookmark(entryId, pos) {
    // 楽観的 UI：useStore が Supabase 更新後にローカル state も更新する
    onUpdateEntry(entryId, { bookmark_pos: pos })
  }

  function jumpToBookmark() {
    const entryId = cls.entries.find(e => e.bookmark_pos !== null && e.bookmark_pos !== undefined)?.id
    if (!entryId) return
    setExpandedIds(prev => new Set([...prev, entryId]))
    setTimeout(() => {
      document.querySelector('.seg-divider--active')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }

  function handleSave(form) {
    if (editingId) { onUpdateEntry(editingId, form); setEditingId(null) }
    else           { onAddEntry(form);               setShowForm(false)  }
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredEntries = q
    ? cls.entries.filter(e =>
        [e.label, e.chinese, e.pinyin, e.japanese]
          .some(t => (t || '').toLowerCase().includes(q))
      )
    : cls.entries

  const editingEntry   = editingId ? cls.entries.find(e => e.id === editingId) : null
  const hasAnyBookmark = cls.entries.some(e => e.bookmark_pos !== null && e.bookmark_pos !== undefined)
  const allExpanded    = filteredEntries.length > 0 && filteredEntries.every(e => expandedIds.has(e.id))

  return (
    <div className="page">
      {/* ページヘッダー */}
      <header className="page-header">
        <button className="btn-back" onClick={onBack}>← 戻る</button>
        <h1 className="page-title">{cls.name}</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null) }}>＋ 追加</button>
      </header>

      {/* ─── Sticky ツールバー ─── */}
      <div className="toolbar">
        <ClassTimer endTime={cls.end_time} dayOfWeek={cls.day_of_week} />
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            ref={searchRef}
            className="search-input"
            type="text"
            placeholder="本文・ラベルを検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        <div className="toolbar-actions">
          {hasAnyBookmark && (
            <button className="toolbar-btn" onClick={jumpToBookmark} title="しおりへジャンプ">
              🔖
            </button>
          )}
          <button
            className="toolbar-btn"
            onClick={() =>
              allExpanded
                ? setExpandedIds(new Set())
                : setExpandedIds(new Set(filteredEntries.map(e => e.id)))
            }
            title={allExpanded ? '全て折りたたむ' : '全て展開'}
          >
            {allExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

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
      {cls.entries.length === 0 && !showForm && <p className="empty">翻訳文を追加してください</p>}
      {filteredEntries.length === 0 && q && <p className="empty">「{searchQuery}」に一致する文が見つかりません</p>}

      <div className="entry-list">
        {filteredEntries.map(entry => (
          <EntryCard
            key={entry.id}
            entry={entry}
            expanded={expandedIds.has(entry.id)}
            onToggle={() => setExpandedIds(prev => {
              const next = new Set(prev)
              next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id)
              return next
            })}
            bookmarkPos={entry.bookmark_pos ?? null}
            onSetBookmark={pos => handleSetBookmark(entry.id, pos)}
            onEdit={() => { setEditingId(entry.id); setShowForm(false) }}
            onDelete={() => onDeleteEntry(entry.id)}
            onUpdate={updated => onUpdateEntry(entry.id, updated)}
          />
        ))}
      </div>
    </div>
  )
}
