import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Settings as SettingsIcon, Zap, Server, Database, AlertCircle, Check } from 'lucide-react'

export default function Settings() {
  const { token, role } = useAuth()
  const isAdmin = role === 'Admin'

  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const [autoCalc, setAutoCalc] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/settings', token)
      setSettings(data)
      setAutoCalc(data.auto_emission_calc === 'true')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleToggle = async () => {
    if (!isAdmin) return
    const newVal = !autoCalc
    setAutoCalc(newVal)
    setSaving(true); setSaved(false); setError('')
    try {
      await api.put('/settings', token, { auto_emission_calc: newVal ? 'true' : 'false' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
      setAutoCalc(!newVal) // revert
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-400 shadow-lg">
            <SettingsIcon className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Platform Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">System configuration &amp; preferences</p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
            <Check className="w-3.5 h-3.5" /> Saved
          </div>
        )}
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Environmental Settings Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Environmental Module</h2>

        {/* Auto Emission Calculation Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Auto Emission Calculation</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm leading-relaxed">
                When enabled, Carbon Transactions can be linked to ERP records (Purchase / Manufacturing / Expense / Fleet).
                Selecting an ERP record automatically pre-fills the department, quantity, and date.
              </p>
              {!isAdmin && (
                <p className="text-xs text-amber-400 mt-1.5 font-medium">Admin access required to change this setting.</p>
              )}
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={handleToggle}
            disabled={!isAdmin || saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ml-6 ${
              autoCalc ? 'bg-emerald-500' : 'bg-slate-700'
            } ${(!isAdmin || saving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${autoCalc ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <p className="text-xs text-slate-500 px-1">
          Current value: <span className={`font-semibold font-mono ${autoCalc ? 'text-emerald-400' : 'text-slate-400'}`}>{autoCalc ? 'true' : 'false'}</span>
        </p>
      </div>

      {/* System Info */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Server, label: 'Backend API', value: 'Flask REST', sub: 'Python 3 · v1.0', color: 'text-emerald-400' },
            { icon: Database, label: 'Database', value: 'Supabase Postgres', sub: 'Connected', color: 'text-teal-400' },
            { icon: Zap, label: 'Auth Provider', value: 'Supabase Auth', sub: 'JWT verified', color: 'text-cyan-400' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <Icon className={`w-4 h-4 ${color} mt-0.5 shrink-0`} />
              <div>
                <p className="text-xs text-slate-500 font-semibold">{label}</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <p className="text-center text-slate-500 text-sm">Loading settings…</p>
      )}
    </div>
  )
}
