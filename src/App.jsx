import { useState } from 'react'
import ClassList from './components/ClassList'
import ClassDetail from './components/ClassDetail'
import { useStore } from './hooks/useStore'
import './App.css'

export default function App() {
  const { data, loading, error, addClass, deleteClass, updateClass, addEntry, updateEntry, deleteEntry, getClass } = useStore()
  const [selectedId, setSelectedId] = useState(null)

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <p>読み込み中…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-screen">
          <p>⚠️ データの取得に失敗しました</p>
          <small>{error}</small>
        </div>
      </div>
    )
  }

  const selectedClass = selectedId ? getClass(selectedId) : null

  return (
    <div className="app">
      {!selectedClass ? (
        <ClassList
          classes={data.classes}
          onSelect={setSelectedId}
          onAdd={addClass}
          onDelete={deleteClass}
          onUpdate={updateClass}
        />
      ) : (
        <ClassDetail
          cls={selectedClass}
          onBack={() => setSelectedId(null)}
          onAddEntry={form => addEntry(selectedId, form)}
          onUpdateEntry={(entryId, form) => updateEntry(selectedId, entryId, form)}
          onDeleteEntry={entryId => deleteEntry(selectedId, entryId)}
        />
      )}
    </div>
  )
}
