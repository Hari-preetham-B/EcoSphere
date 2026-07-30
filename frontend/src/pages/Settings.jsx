import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Settings as SettingsIcon, Zap, Server, Database, AlertCircle, Check, Medal } from 'lucide-react'

export default function Settings() {
  const { token, role } = useAuth()
  const isAdmin = role === 'Admin'

  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const [autoCalc, setAutoCalc] = useState(false)
  const [requireProof, setRequireProof] = useState(false)
  const [badgeAutoAward, setBadgeAutoAward] = useState(true)

  const [wEnv, setWEnv] = useState('0.40')
  const [wSoc, setWSoc] = useState('0.30')
  const [wGov, setWGov] = useState('0.30')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/settings', token)
      setSettings(data)
      setAutoCalc(data.auto_emission_calc === 'true')
      setRequireProof(data.require_proof_for_csr === 'true')
      setBadgeAutoAward(data.badge_auto_award !== 'false')
      if (data.weight_env) setWEnv(data.weight_env)
      if (data.weight_soc) setWSoc(data.weight_soc)
      if (data.weight_gov) setWGov(data.weight_gov)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleToggleAutoCalc = async () => {
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
      setAutoCalc(!newVal)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleRequireProof = async () => {
    if (!isAdmin) return
    const newVal = !requireProof
    setRequireProof(newVal)
    setSaving(true); setSaved(false); setError('')
    try {
      await api.put('/settings', token, { require_proof_for_csr: newVal ? 'true' : 'false' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
      setRequireProof(!newVal)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleBadgeAutoAward = async () => {
    if (!isAdmin) return
    const newVal = !badgeAutoAward
    setBadgeAutoAward(newVal)
    setSaving(true); setSaved(false); setError('')
    try {
      await api.put('/settings', token, { badge_auto_award: newVal ? 'true' : 'false' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
      setBadgeAutoAward(!newVal)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWeights = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    setSaving(true); setSaved(false); setError('')
    try {
      await api.put('/settings', token, {
        weight_env: wEnv,
        weight_soc: wSoc,
        weight_gov: wGov,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
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

          <button
            onClick={handleToggleAutoCalc}
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

      {/* Social Settings Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Social Module</h2>

        {/* Require Proof for CSR Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0 mt-0.5">
              <SettingsIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Require Proof for CSR Approval</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm leading-relaxed">
                When enabled, managers cannot approve an employee CSR participation record or award Points/XP unless a valid verification proof file (Image or PDF) has been uploaded.
              </p>
              {!isAdmin && (
                <p className="text-xs text-amber-400 mt-1.5 font-medium">Admin access required to change this setting.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleToggleRequireProof}
            disabled={!isAdmin || saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ml-6 ${
              requireProof ? 'bg-emerald-500' : 'bg-slate-700'
            } ${(!isAdmin || saving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${requireProof ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <p className="text-xs text-slate-500 px-1">
          Current value: <span className={`font-semibold font-mono ${requireProof ? 'text-emerald-400' : 'text-slate-400'}`}>{requireProof ? 'true' : 'false'}</span>
        </p>

        {/* ESG Pillar Weights Sub-Card */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <p className="text-xs font-bold text-slate-200">ESG Score Pillar Weights (Configurable per Organization)</p>
          <p className="text-xs text-slate-400">Controls the relative weighting used when computing Department & Organization Total ESG Scores.</p>

          <form onSubmit={handleSaveWeights} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Environmental Weight (0.0 - 1.0)</label>
              <input
                disabled={!isAdmin}
                type="number" step="0.05" min="0" max="1"
                value={wEnv} onChange={(e) => setWEnv(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-sky-400 mb-1">Social Weight (0.0 - 1.0)</label>
              <input
                disabled={!isAdmin}
                type="number" step="0.05" min="0" max="1"
                value={wSoc} onChange={(e) => setWSoc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-purple-400 mb-1">Governance Weight (0.0 - 1.0)</label>
              <input
                disabled={!isAdmin}
                type="number" step="0.05" min="0" max="1"
                value={wGov} onChange={(e) => setWGov(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            {isAdmin && (
              <div className="sm:col-span-3 flex justify-end pt-1">
                <button
                  type="submit" disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30">
                  {saving ? 'Saving...' : 'Save Pillar Weights'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Gamification Settings Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Gamification Module</h2>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0 mt-0.5">
              <Medal className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Badge Auto-Award</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm leading-relaxed">
                When enabled, badges are automatically awarded the moment an employee's progress satisfies a badge's unlock rule — immediately after any CSR or Challenge approval.
                Point-based badges always use lifetime XP (never decremented by reward redemptions).
              </p>
              {!isAdmin && (
                <p className="text-xs text-amber-400 mt-1.5 font-medium">Admin access required to change this setting.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleToggleBadgeAutoAward}
            disabled={!isAdmin || saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ml-6 ${
              badgeAutoAward ? 'bg-purple-500' : 'bg-slate-700'
            } ${(!isAdmin || saving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${badgeAutoAward ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <p className="text-xs text-slate-500 px-1">
          Current value: <span className={`font-semibold font-mono ${badgeAutoAward ? 'text-purple-400' : 'text-slate-400'}`}>{badgeAutoAward ? 'true' : 'false'}</span>
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
