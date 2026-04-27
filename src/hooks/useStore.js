import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Supabase の snake_case を React 側に揃える
function normalizeClass(cls) {
  return {
    ...cls,
    createdAt: cls.created_at,
    entries: (cls.entries || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  }
}

export function useStore() {
  const [data, setData] = useState({ classes: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 初回フェッチ
  async function fetchAll() {
    setLoading(true)
    const { data: classes, error: err } = await supabase
      .from('classes')
      .select('*, entries(*)')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setData({ classes: classes.map(normalizeClass) })
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // --- 授業 ---
  async function addClass(name) {
    const { data: cls, error: err } = await supabase
      .from('classes')
      .insert({ name })
      .select()
      .single()

    if (!err) {
      const newCls = normalizeClass({ ...cls, entries: [] })
      setData(d => ({ classes: [newCls, ...d.classes] }))
      return cls.id
    }
  }

  async function deleteClass(classId) {
    await supabase.from('classes').delete().eq('id', classId)
    setData(d => ({ classes: d.classes.filter(c => c.id !== classId) }))
  }

  async function renameClass(classId, name) {
    await supabase.from('classes').update({ name }).eq('id', classId)
    setData(d => ({
      classes: d.classes.map(c => c.id === classId ? { ...c, name } : c),
    }))
  }

  async function updateClass(classId, fields) {
    await supabase.from('classes').update(fields).eq('id', classId)
    setData(d => ({
      classes: d.classes.map(c => c.id === classId ? { ...c, ...fields } : c),
    }))
  }

  // --- エントリー ---
  async function addEntry(classId, entry) {
    const { data: newEntry, error: err } = await supabase
      .from('entries')
      .insert({ class_id: classId, ...entry })
      .select()
      .single()

    if (!err) {
      setData(d => ({
        classes: d.classes.map(c =>
          c.id === classId
            ? { ...c, entries: [...c.entries, newEntry] }
            : c
        ),
      }))
      return newEntry.id
    }
  }

  async function updateEntry(classId, entryId, entry) {
    const { data: updated, error: err } = await supabase
      .from('entries')
      .update(entry)
      .eq('id', entryId)
      .select()
      .single()

    if (!err) {
      setData(d => ({
        classes: d.classes.map(c =>
          c.id === classId
            ? {
                ...c,
                entries: c.entries.map(e =>
                  e.id === entryId ? { ...e, ...updated } : e
                ),
              }
            : c
        ),
      }))
    }
  }

  async function deleteEntry(classId, entryId) {
    await supabase.from('entries').delete().eq('id', entryId)
    setData(d => ({
      classes: d.classes.map(c =>
        c.id === classId
          ? { ...c, entries: c.entries.filter(e => e.id !== entryId) }
          : c
      ),
    }))
  }

  function getClass(classId) {
    return data.classes.find(c => c.id === classId)
  }

  return {
    data,
    loading,
    error,
    addClass,
    deleteClass,
    renameClass,
    updateClass,
    addEntry,
    updateEntry,
    deleteEntry,
    getClass,
  }
}
