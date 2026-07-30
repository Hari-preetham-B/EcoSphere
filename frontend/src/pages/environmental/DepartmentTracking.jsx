import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Building2, TrendingUp, AlertCircle } from 'lucide-react'

export default function DepartmentTracking() {
  const { token } = useAuth()
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/carbon-transactions/department-summary', token)
      setSummary(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const max = Math.max(...summary.map(s => s.total_co2e), 1)
  const total = summary.reduce((a, b) => a + b.total_co2e, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-slate-600 to-teal-500 shadow-lg">
            <Building2 className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Department Carbon Tracking</h1>
            <p className="text-xs text-slate-400 mt-0.5">Cumulative CO₂e emissions by department</p>
          </div>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl border border-slate-800 text-right">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Emissions</p>
          <p className="text-xl font-extrabold font-mono text-emerald-400">{total.toFixed(2)} t</p>
        </div>
      </div>

      {error && (
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
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Transactions</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Total CO₂e</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 w-56">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Loading department data…</td></tr>
              ) : summary.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">No departments found.</td></tr>
              ) : summary.map((s, idx) => {
                const pct = total > 0 ? (s.total_co2e / total) * 100 : 0
                const barPct = (s.total_co2e / max) * 100
                return (
                  <tr key={s.department_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center justify-center border border-emerald-500/20">{idx + 1}</span>
                        <span className="font-semibold text-slate-200">{s.department_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{s.transaction_count}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-emerald-400 text-sm">{s.total_co2e.toFixed(2)} t</span>
                      {pct > 0 && <span className="ml-2 text-xs text-slate-500">({pct.toFixed(1)}%)</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && summary.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <TrendingUp className="w-3.5 h-3.5" />
          Showing cumulative emissions for all time across {summary.filter(s => s.transaction_count > 0).length} active department(s).
        </div>
      )}
    </div>
  )
}
