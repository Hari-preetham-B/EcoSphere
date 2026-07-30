import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Target, Plus, Edit2, Trash2, X, Check, AlertCircle, ChevronDown } from 'lucide-react'

const STATUSES = ['Active', 'Achieved', 'Expired']

const statusColor = (s) => ({
  Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Achieved: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  Expired: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
}[s] || 'bg-slate-800 text-slate-400')

const todayStr = () => new Date().toISOString().split('T')[0]

const defaultForm = { name: '', metric: 'CO2e Reduction', target_value: '', deadline: '', department_id: '', status: 'Active' }

export default function SustainabilityGoals() {
  const { token, role } = useAuth()
  const canEdit = role === 'Admin' || role === 'ESG Manager'

  const [goals, setGoals] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g, d] = await Promise.all([
        api.get('/sustainability-goals', token),
        api.get('/departments?status=Active', token),
      ])
      setGoals(g)
      setDepartments(d)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditId(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (g) => {
    setEditId(g.id)
    setForm({ name: g.name, metric: g.metric, target_value: String(g.target_value), deadline: g.deadline, department_id: g.department_id ? String(g.department_id) : '', status: g.status })
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setError('') }

  const handleSave = async () => {
    if (!form.name || !form.metric || !form.target_value || !form.deadline) { setError('Name, metric, target value, and deadline are required'); return }
    setSaving(true); setError('')
    try {
      const body = { ...form, target_value: parseFloat(form.target_value), department_id: form.department_id ? parseInt(form.department_id) : null }
      if (editId) await api.put(`/sustainability-goals/${editId}`, token, body)
      else await api.post('/sustainability-goals', token, body)
      closeModal(); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await api.delete(`/sustainability-goals/${id}`, token); setDeleteId(null); load() }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 shadow-lg">
            <Target className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Sustainability Goals</h1>
            <p className="text-xs text-slate-400 mt-0.5">Track progress against CO₂e reduction targets</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> New Goal
          </button>
        )}
      </div>

      {error && !showModal && (
        <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Goals Cards */}
      {loading ? (
        <div className="text-center text-slate-500 py-16">Loading goals…</div>
      ) : goals.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-16 text-center text-slate-500">
          No sustainability goals yet. {canEdit && 'Create one to start tracking progress.'}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(g => {
            const pct = g.progress_pct || 0
            const isAchieved = pct >= 100
            return (
              <div key={g.id} className={`glass-panel rounded-2xl border p-5 space-y-3 ${isAchieved ? 'border-teal-500/30' : 'border-slate-800'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{g.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColor(g.status)}`}>{g.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{g.department_name} · {g.metric} · Deadline: {g.deadline}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Actual: <strong className="text-slate-200">{Number(g.actual_co2e || 0).toFixed(2)} t</strong></span>
                    <span><strong className="text-slate-200">{pct}%</strong> of {g.target_value} t target</span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isAchieved ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-700 p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">{editId ? 'Edit' : 'New'} Sustainability Goal</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Goal Name <span className="text-red-400">*</span></label>
                <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500" placeholder="e.g. Net Zero by 2030" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Metric <span className="text-red-400">*</span></label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500" placeholder="CO2e Reduction" value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target (tCO₂e) <span className="text-red-400">*</span></label>
                  <input type="number" min="0" step="any" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500" placeholder="500" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Deadline <span className="text-red-400">*</span></label>
                  <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                  <div className="relative">
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 appearance-none" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Department (leave blank for company-wide)</label>
                <div className="relative">
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 appearance-none" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">— Company-wide —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm font-medium">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? 'Saving…' : <><Check className="w-4 h-4" />Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-red-500/30 p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Delete Goal?</h2>
            <p className="text-sm text-slate-400">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
