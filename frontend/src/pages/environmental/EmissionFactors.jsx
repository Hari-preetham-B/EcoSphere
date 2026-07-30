import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Plus, Edit2, Trash2, X, Check, FlaskConical, AlertCircle, ChevronDown } from 'lucide-react'

const UNITS = ['kg', 'litre', 'kWh', 'km', 'tonne', 'night', 'm³', 'MJ']

const defaultForm = { activity_type: '', unit: 'kg', co2e_factor: '', description: '' }

export default function EmissionFactors() {
  const { token, role } = useAuth()
  const canEdit = role === 'Admin' || role === 'ESG Manager'

  const [factors, setFactors] = useState([])
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
      const data = await api.get('/emission-factors', token)
      setFactors(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditId(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (f) => { setEditId(f.id); setForm({ activity_type: f.activity_type, unit: f.unit, co2e_factor: String(f.co2e_factor), description: f.description }); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setError('') }

  const handleSave = async () => {
    if (!form.activity_type || !form.unit || !form.co2e_factor) { setError('All required fields must be filled'); return }
    setSaving(true); setError('')
    try {
      const body = { ...form, co2e_factor: parseFloat(form.co2e_factor) }
      if (editId) await api.put(`/emission-factors/${editId}`, token, body)
      else await api.post('/emission-factors', token, body)
      closeModal(); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await api.delete(`/emission-factors/${id}`, token); setDeleteId(null); load() }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-lg">
            <FlaskConical className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Emission Factors</h1>
            <p className="text-xs text-slate-400 mt-0.5">CO₂e conversion factors per activity type</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> Add Factor
          </button>
        )}
      </div>

      {error && !showModal && (
        <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Activity Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Unit</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">CO₂e / Unit</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                {canEdit && <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">Loading emission factors…</td></tr>
              ) : factors.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">No emission factors defined yet. {canEdit && 'Create one to get started.'}</td></tr>
              ) : factors.map(f => (
                <tr key={f.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-200">{f.activity_type}</td>
                  <td className="px-5 py-3.5 text-slate-400">{f.unit}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/20">
                      {f.co2e_factor} tCO₂e
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">{f.description || '—'}</td>
                  {canEdit && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(f)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(f.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-700 p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">{editId ? 'Edit' : 'New'} Emission Factor</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all"><X className="w-4 h-4" /></button>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Activity Type <span className="text-red-400">*</span></label>
                <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. Diesel, Natural Gas, Air Travel" value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Unit <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors appearance-none" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CO₂e / Unit <span className="text-red-400">*</span></label>
                  <input type="number" step="0.0001" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. 2.68" value={form.co2e_factor} onChange={e => setForm(f => ({ ...f, co2e_factor: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none" placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm font-medium transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-red-500/30 p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100">Delete Emission Factor?</h2>
            <p className="text-sm text-slate-400">This action cannot be undone. Existing transactions linked to this factor will lose their reference.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm font-medium transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
