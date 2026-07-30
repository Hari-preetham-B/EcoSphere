import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Plus, Trash2, X, Check, Zap, AlertCircle, ChevronDown, Info } from 'lucide-react'

const SOURCES = ['Purchase', 'Manufacturing', 'Expense', 'Fleet']

const today = () => new Date().toISOString().split('T')[0]

export default function CarbonTransactions() {
  const { token, role } = useAuth()
  const canDelete = role === 'Admin' || role === 'ESG Manager'

  const [transactions, setTransactions] = useState([])
  const [departments, setDepartments] = useState([])
  const [factors, setFactors] = useState([])
  const [erpRecords, setErpRecords] = useState([])
  const [autoCalc, setAutoCalc] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const defaultForm = { department_id: '', source: 'Fleet', quantity: '', emission_factor_id: '', date: today(), notes: '', erp_record_id: '' }
  const [form, setForm] = useState(defaultForm)

  const co2ePreview = (() => {
    const q = parseFloat(form.quantity)
    const f = factors.find(x => String(x.id) === String(form.emission_factor_id))
    if (q > 0 && f) return (q * f.co2e_factor).toFixed(4)
    return null
  })()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [txns, depts, facs, settings] = await Promise.all([
        api.get('/carbon-transactions', token),
        api.get('/departments?status=Active', token),
        api.get('/emission-factors', token),
        api.get('/settings', token),
      ])
      setTransactions(txns)
      setDepartments(depts)
      setFactors(facs)
      setAutoCalc(settings.auto_emission_calc === 'true')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  // Load ERP records when modal opens and auto_calc is on
  const openCreate = async () => {
    setForm(defaultForm); setError(''); setShowModal(true)
    if (autoCalc) {
      try { setErpRecords(await api.get('/erp-records', token)) }
      catch { /* non-fatal */ }
    }
  }

  const closeModal = () => { setShowModal(false); setError('') }

  const handleSourceChange = async (src) => {
    setForm(f => ({ ...f, source: src, erp_record_id: '' }))
    if (autoCalc) {
      try { setErpRecords(await api.get(`/erp-records?type=${src}`, token)) }
      catch { /* non-fatal */ }
    }
  }

  const handleErpSelect = (erpId) => {
    const rec = erpRecords.find(r => String(r.id) === String(erpId))
    if (rec) {
      setForm(f => ({
        ...f,
        erp_record_id: erpId,
        quantity: String(rec.quantity),
        department_id: rec.department_id ? String(rec.department_id) : f.department_id,
        date: rec.date || f.date,
      }))
    } else {
      setForm(f => ({ ...f, erp_record_id: erpId }))
    }
  }

  const handleSave = async () => {
    if (!form.department_id || !form.source || !form.quantity || !form.emission_factor_id || !form.date) {
      setError('Department, source, quantity, emission factor, and date are required'); return
    }
    setSaving(true); setError('')
    try {
      const body = {
        department_id: parseInt(form.department_id),
        source: form.source,
        quantity: parseFloat(form.quantity),
        emission_factor_id: parseInt(form.emission_factor_id),
        date: form.date,
        notes: form.notes,
        erp_record_id: form.erp_record_id ? parseInt(form.erp_record_id) : null,
      }
      await api.post('/carbon-transactions', token, body)
      closeModal(); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await api.delete(`/carbon-transactions/${id}`, token); setDeleteId(null); load() }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-400 shadow-lg">
            <Zap className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Carbon Transactions</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manual emission entries • Auto-calc is
              <span className={`ml-1 font-semibold ${autoCalc ? 'text-emerald-400' : 'text-slate-500'}`}>{autoCalc ? 'ON' : 'OFF'}</span>
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> New Transaction
        </button>
      </div>

      {error && !showModal && (
        <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Auto-calc info banner */}
      {autoCalc && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-teal-500/20 bg-teal-500/5 text-teal-400 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          Auto Emission Calculation is enabled — you can select an ERP record to pre-fill quantity and department.
        </div>
      )}

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {['Date', 'Department', 'Source', 'Quantity', 'Factor', 'CO₂e (t)', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
                {canDelete && <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Del</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading transactions…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No transactions yet. Create one to start tracking emissions.</td></tr>
              ) : transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{t.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{t.department_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-300">{t.source}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{t.quantity} {t.unit}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[140px]">{t.emission_factor}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-emerald-400 text-xs px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{Number(t.co2e).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[120px]">{t.notes || '—'}</td>
                  {canDelete && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-700 p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">New Carbon Transaction</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all"><X className="w-4 h-4" /></button>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Source <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 appearance-none"
                    value={form.source} onChange={e => handleSourceChange(e.target.value)}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date <span className="text-red-400">*</span></label>
                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            {/* ERP Record selector — shown only when auto_calc is on */}
            {autoCalc && (
              <div>
                <label className="block text-xs font-semibold text-teal-400 mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> ERP Record (auto-fill)</label>
                <div className="relative">
                  <select className="w-full bg-slate-900 border border-teal-500/30 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 appearance-none"
                    value={form.erp_record_id} onChange={e => handleErpSelect(e.target.value)}>
                    <option value="">— Select ERP Record —</option>
                    {erpRecords.filter(r => r.record_type === form.source).map(r => (
                      <option key={r.id} value={r.id}>{r.reference_no} · {r.description?.slice(0, 40)} ({r.quantity} {r.unit})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Department <span className="text-red-400">*</span></label>
              <div className="relative">
                <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 appearance-none"
                  value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Emission Factor */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Emission Factor <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 appearance-none"
                    value={form.emission_factor_id} onChange={e => setForm(f => ({ ...f, emission_factor_id: e.target.value }))}>
                    <option value="">— Select Factor —</option>
                    {factors.map(f => <option key={f.id} value={f.id}>{f.activity_type} ({f.unit})</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Quantity <span className="text-red-400">*</span></label>
                <input type="number" min="0" step="any" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 100" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
            </div>

            {/* Live CO2e preview */}
            {co2ePreview !== null && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-slate-300">Computed CO₂e: <strong className="text-emerald-400 font-mono">{co2ePreview} t</strong></span>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
              <textarea rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Optional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm font-medium transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? 'Saving…' : <><Check className="w-4 h-4" />Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-red-500/30 p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Delete Transaction?</h2>
            <p className="text-sm text-slate-400">This cannot be undone.</p>
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
