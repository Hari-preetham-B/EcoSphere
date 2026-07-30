import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Medal, Plus, X, Lock, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react'

const RULE_TYPE_LABELS = {
  total_points: 'Lifetime XP Points',
  completed_challenges: 'Challenges Completed',
  completed_csr: 'CSR Activities Completed',
}

const BadgesPage = () => {
  const { token, role } = useAuth()
  const isManager = role === 'Admin' || role === 'ESG Manager'

  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', icon: '🏅',
    unlock_rule_type: 'total_points', unlock_rule_value: 100
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.get('/gamification/badges', token)
      setBadges(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      await api.post('/gamification/badges', token, {
        ...form,
        unlock_rule_value: parseInt(form.unlock_rule_value) || 100,
      })
      setShowCreate(false)
      setForm({ name: '', description: '', icon: '🏅', unlock_rule_type: 'total_points', unlock_rule_value: 100 })
      load()
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const earnedBadges = badges.filter(b => b.earned)
  const pendingBadges = badges.filter(b => !b.earned)

  const progressPct = (badge) => {
    if (badge.earned) return 100
    const pct = Math.min(100, Math.round((badge.user_progress / badge.unlock_rule_value) * 100))
    return pct
  }

  const ICON_SUGGESTIONS = ['🏅', '🌱', '🤝', '🌿', '🛡️', '⭐', '🏆', '🔥', '💎', '🎯', '🌍', '♻️', '🌞', '🦋']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">Gamification</span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">Badges & Achievements</h1>
          <p className="text-xs text-slate-400 mt-1">
            Badges are auto-awarded the moment you hit an unlock threshold.{' '}
            <span className="text-purple-300">Point-based badges use lifetime XP — redeeming rewards never removes progress.</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm font-bold text-purple-300">
            🏅 {earnedBadges.length} / {badges.length} Earned
          </div>
          {isManager && (
            <button onClick={() => setShowCreate(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-purple-600/30">
              <Plus className="w-4 h-4" /> Create Badge
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading badges...</div>
      ) : (
        <>
          {/* Earned Badges Section */}
          {earnedBadges.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Earned Badges ({earnedBadges.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {earnedBadges.map(badge => (
                  <div key={badge.id}
                    className="glass-card p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 flex flex-col items-center text-center gap-3 hover:border-emerald-500/50 transition-all shadow-sm shadow-emerald-500/10">
                    <span className="text-4xl drop-shadow">{badge.icon}</span>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-emerald-300 leading-tight">{badge.name}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{badge.description}</p>
                    </div>
                    <div className="w-full px-0.5 mt-auto">
                      <div className="h-1 w-full bg-emerald-500/30 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-full transition-all" />
                      </div>
                      <p className="text-[10px] text-emerald-400/70 mt-1.5 font-semibold">✓ Unlocked</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges Section */}
          {pendingBadges.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Locked Badges ({pendingBadges.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pendingBadges.map(badge => {
                  const pct = progressPct(badge)
                  const progressColor = pct >= 75 ? 'bg-amber-400' : pct >= 40 ? 'bg-sky-400' : 'bg-slate-600'
                  return (
                    <div key={badge.id}
                      className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-3 opacity-70 hover:opacity-90 transition-all">
                      <div className="relative">
                        <span className="text-4xl grayscale opacity-50">{badge.icon}</span>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-300 leading-tight">{badge.name}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">{badge.description}</p>
                      </div>
                      <div className="w-full mt-auto space-y-1.5">
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {badge.user_progress.toLocaleString()} / {badge.unlock_rule_value.toLocaleString()}&nbsp;
                          <span className="text-slate-600">{RULE_TYPE_LABELS[badge.unlock_rule_type] || badge.unlock_rule_type}</span>
                        </p>
                        {badge.unlock_rule_type === 'total_points' && (
                          <p className="text-[10px] text-purple-400/70 italic">Uses lifetime XP</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {badges.length === 0 && (
            <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
              <Medal className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-300">No Badges Yet</h3>
              <p className="text-sm text-slate-500">
                {isManager ? 'Create your first badge to start the gamification journey.' : 'No badges have been set up yet. Check back soon!'}
              </p>
            </div>
          )}

          {/* Info card */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <TrendingUp className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-300 font-semibold">How badge auto-award works: </span>
              Badges are checked and automatically awarded after every CSR approval <em>and</em> every Challenge approval.
              Point-based badge thresholds always use your <span className="text-purple-300 font-semibold">lifetime XP earned</span> — not your spendable balance —
              so redeeming rewards never reduces your progress toward a point badge.
            </div>
          </div>
        </>
      )}

      {/* Create Badge Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Medal className="w-5 h-5 text-purple-400" /> Create Badge
              </h3>
              <button onClick={() => { setShowCreate(false); setCreateError('') }}
                className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            {createError && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Badge Name *</label>
                <input required type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Zero-Waste Hero"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500" />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this badge represent?"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500" />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-2">Icon (pick or type emoji)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ICON_SUGGESTIONS.map(icon => (
                    <button type="button" key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={`text-xl p-1.5 rounded-lg border transition-all ${form.icon === icon ? 'border-purple-500 bg-purple-500/20' : 'border-slate-800 hover:border-slate-600'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
                <input type="text" value={form.icon} maxLength={4}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  placeholder="Or type an emoji"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-purple-500 text-center text-2xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unlock Rule</label>
                  <select value={form.unlock_rule_type}
                    onChange={e => setForm({ ...form, unlock_rule_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500">
                    <option value="total_points">Lifetime XP Points</option>
                    <option value="completed_challenges">Challenges Completed</option>
                    <option value="completed_csr">CSR Activities Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Threshold Value</label>
                  <input type="number" min={1} value={form.unlock_rule_value}
                    onChange={e => setForm({ ...form, unlock_rule_value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-mono" />
                </div>
              </div>

              {form.unlock_rule_type === 'total_points' && (
                <p className="text-[11px] text-purple-400 bg-purple-500/10 px-3 py-2 rounded-xl border border-purple-500/20">
                  ℹ️ Point-based badges use <strong>lifetime XP earned</strong>, not the spendable balance. Redeeming rewards never reduces badge progress.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError('') }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30">
                  {creating ? 'Creating...' : 'Create Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BadgesPage
