import { useState } from 'react'

const PROMPT_TEMPLATE = `以下のフォーマットで、文ごとに1行ずつ改行して出力してください（説明文は不要）。
短文1文でも、複数文の長文でも同じフォーマットを使ってください。

中文：
[文1]
[文2]
...

拼音：
[文1のピンイン]
[文2のピンイン]
...

日本語：
[文1の日本語訳]
[文2の日本語訳]
...`

// ── AI 出力パーサー ───────────────────────────────────────────
function parseAiOutput(text) {
  const sections = {}
  let current = null

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const header =
      line.startsWith('中文：') || line.startsWith('中文:') ? 'chinese' :
      line.startsWith('拼音：') || line.startsWith('拼音:') ? 'pinyin' :
      (line.startsWith('日本語：') || line.startsWith('日本語:')) ? 'japanese' : null

    if (header) {
      current = header
      sections[current] ??= []
      const rest = line.slice(line.indexOf('：') > -1 ? line.indexOf('：') + 1 : line.indexOf(':') + 1).trim()
      if (rest) sections[current].push(rest)
    } else if (current && line) {
      sections[current] ??= []
      sections[current].push(line)
    }
  }

  return {
    chinese:  (sections.chinese  || []),
    pinyin:   (sections.pinyin   || []),
    japanese: (sections.japanese || []),
  }
}

// 配列 → 行ごとの {chinese, pinyin, japanese} オブジェクト配列
function toRows(zh, py, ja) {
  const len = Math.max(zh.length, py.length, ja.length)
  const rows = Array.from({ length: len }, (_, i) => ({
    chinese:  zh[i] || '',
    pinyin:   py[i] || '',
    japanese: ja[i] || '',
  }))
  // 末尾の空行を除去
  while (rows.length > 1) {
    const last = rows[rows.length - 1]
    if (!last.chinese && !last.pinyin && !last.japanese) rows.pop()
    else break
  }
  return rows
}

// rows → form の各フィールド（改行区切り文字列）
function rowsToForm(rows) {
  return {
    chinese:  rows.map(r => r.chinese).join('\n'),
    pinyin:   rows.map(r => r.pinyin).join('\n'),
    japanese: rows.map(r => r.japanese).join('\n'),
  }
}

// ── 行確認テーブル ────────────────────────────────────────────
function ParseVerifier({ rows: init, onConfirm, onBack }) {
  const [rows, setRows] = useState(init)

  const update = (i, key, val) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))

  const remove = i => setRows(prev => prev.filter((_, idx) => idx !== i))

  const addRow = () => setRows(prev => [...prev, { chinese: '', pinyin: '', japanese: '' }])

  // ずれ検出：どれか 1 つでも入力があるのに揃っていない行
  const warnRows = rows.map(r =>
    (r.chinese || r.pinyin || r.japanese) &&
    (!r.chinese || !r.pinyin || !r.japanese)
  )
  const hasMismatch = warnRows.some(Boolean)

  return (
    <div className="parse-verifier">
      {hasMismatch && (
        <div className="parse-warning">
          ⚠️ ずれがあります。空欄を修正するか、不要な行を削除してから反映してください。
        </div>
      )}

      <div className="parse-rows">
        {rows.map((row, i) => (
          <div key={i} className={`parse-row${warnRows[i] ? ' parse-row--warn' : ''}`}>
            <div className="parse-row-header">
              <span className="parse-row-num">{i + 1}</span>
              {warnRows[i] && <span className="parse-warn-icon">⚠️</span>}
              <button className="btn-danger-sm" onClick={() => remove(i)}>削除</button>
            </div>
            <div className="parse-field">
              <span className="lang-badge zh">中文</span>
              <input
                className={`input parse-input zh-input${!row.chinese && (row.pinyin || row.japanese) ? ' input--empty' : ''}`}
                value={row.chinese}
                onChange={e => update(i, 'chinese', e.target.value)}
                placeholder="（空欄）"
              />
            </div>
            <div className="parse-field">
              <span className="lang-badge py">拼音</span>
              <input
                className={`input parse-input py-input${!row.pinyin && (row.chinese || row.japanese) ? ' input--empty' : ''}`}
                value={row.pinyin}
                onChange={e => update(i, 'pinyin', e.target.value)}
                placeholder="（空欄）"
              />
            </div>
            <div className="parse-field">
              <span className="lang-badge ja">日本語</span>
              <input
                className={`input parse-input ja-input${!row.japanese && (row.chinese || row.pinyin) ? ' input--empty' : ''}`}
                value={row.japanese}
                onChange={e => update(i, 'japanese', e.target.value)}
                placeholder="（空欄）"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="parse-footer">
        <button className="btn-ghost btn-sm" onClick={addRow}>＋ 行を追加</button>
        <div className="parse-footer-actions">
          <button className="btn-ghost" onClick={onBack}>← 戻る</button>
          <button className="btn-primary" onClick={() => onConfirm(rowsToForm(rows))}>
            ✓ 反映
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EntryForm 本体 ────────────────────────────────────────────
export default function EntryForm({ initial, onSave, onCancel }) {
  const [tab, setTab]             = useState('manual')
  const [pasteText, setPasteText] = useState('')
  const [parseError, setParseError] = useState('')
  const [parsedRows, setParsedRows] = useState(null)   // null = 未解析
  const [form, setForm] = useState({
    label:    initial?.label    ?? '',
    chinese:  initial?.chinese  ?? '',
    pinyin:   initial?.pinyin   ?? '',
    japanese: initial?.japanese ?? '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleParse() {
    const { chinese, pinyin, japanese } = parseAiOutput(pasteText)
    if (!chinese.length && !pinyin.length && !japanese.length) {
      setParseError('フォーマットが認識できませんでした。プロンプトを使って再度AIに依頼してください。')
      return
    }
    setParseError('')
    setParsedRows(toRows(chinese, pinyin, japanese))
  }

  function handleConfirm(texts) {
    setForm(f => ({ ...f, ...texts }))
    setParsedRows(null)
    setTab('manual')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.chinese.trim()) return
    onSave(form)
  }

  function copyPrompt() {
    navigator.clipboard.writeText(PROMPT_TEMPLATE)
  }

  return (
    <div className="entry-form">
      <div className="tab-bar">
        <button className={`tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => { setTab('manual'); setParsedRows(null) }}>手動入力</button>
        <button className={`tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>AIから貼り付け</button>
      </div>

      {/* ── AI 貼り付けタブ ── */}
      {tab === 'ai' && !parsedRows && (
        <div className="ai-panel">
          <p className="ai-hint">
            ① 下のプロンプトをコピーしてAI（Claude等）に依頼<br />
            ② 出力をそのまま貼り付けて「解析」
          </p>
          <div className="prompt-box">
            <pre>{PROMPT_TEMPLATE}</pre>
            <button className="btn-ghost btn-sm" onClick={copyPrompt}>コピー</button>
          </div>
          <textarea
            className="input textarea"
            rows={6}
            placeholder="AIの出力をここに貼り付け..."
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          {parseError && <p className="error">{parseError}</p>}
          <button className="btn-primary" onClick={handleParse}>解析して確認 →</button>
        </div>
      )}

      {/* ── 行確認テーブル（解析後） ── */}
      {tab === 'ai' && parsedRows && (
        <ParseVerifier
          rows={parsedRows}
          onConfirm={handleConfirm}
          onBack={() => setParsedRows(null)}
        />
      )}

      {/* ── 手動入力タブ ── */}
      {tab === 'manual' && (
        <form onSubmit={handleSubmit}>
          <label className="field-label">メモ（任意）
            <input className="input" placeholder="例：p.42 第1段落" value={form.label} onChange={e => set('label', e.target.value)} />
          </label>
          <label className="field-label zh-label">中文（複数文は改行で区切る）
            <textarea className="input textarea zh" rows={5} value={form.chinese} onChange={e => set('chinese', e.target.value)} required />
          </label>
          <label className="field-label py-label">拼音（中文と同じ行数）
            <textarea className="input textarea py" rows={5} value={form.pinyin} onChange={e => set('pinyin', e.target.value)} />
          </label>
          <label className="field-label ja-label">日本語訳（中文と同じ行数）
            <textarea className="input textarea ja" rows={5} value={form.japanese} onChange={e => set('japanese', e.target.value)} />
          </label>
          <div className="form-actions">
            <button className="btn-primary" type="submit">保存</button>
            <button className="btn-ghost" type="button" onClick={onCancel}>キャンセル</button>
          </div>
        </form>
      )}
    </div>
  )
}
