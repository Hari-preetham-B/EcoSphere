import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { ShieldCheck, Award, TrendingUp, Building2, Leaf, Users, AlertTriangle, ArrowUpRight, Trophy } from 'lucide-react'

const OrganizationDashboard = () => {
  const { token, role } = useAuth()
  const [orgData, setOrgData] = useState(null)
  const [deptScores, setDeptScores] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [orgRes, deptsRes, leadRes] = await Promise.all([
        api.get('/scoring/organization', token),
        api.get('/scoring/departments', token),
        api.get('/gamification/leaderboard', token),
      ])
      setOrgData(orgRes)
      setDeptScores(deptsRes)
      setTopPerformers(leadRes.slice(0, 5))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadData() }, [loadData])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    if (score >= 60) return 'text-sky-400 border-sky-500/30 bg-sky-500/10'
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10'
  }

  const getPillarBadge = (val, label, icon) => (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">{icon}</div>
        <div>
          <p className="text-xs text-slate-400 font-medium">{label}</p>
          <p className="text-lg font-black text-slate-100 mt-0.5">{val} <span className="text-xs text-slate-500 font-normal">/ 100</span></p>
        </div>
      </div>
      <div className="h-2 w-20 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${val}%` }} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Phase 5 Executive View</span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">Organization ESG Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time scoring across all departments using live carbon, social, policy, and compliance data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
            Env {Math.round((orgData?.weights?.env || 0.4) * 100)}% | Soc {Math.round((orgData?.weights?.soc || 0.3) * 100)}% | Gov {Math.round((orgData?.weights?.gov || 0.3) * 100)}%
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading Executive Dashboard...</div>
      ) : (
        <>
          {/* Main Hero: Overall ESG Score & Pillar Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall ESG Score Gauge */}
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase rounded-bl-2xl">
                Overall Index
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Organization ESG Score</span>
              
              <div className="relative flex items-center justify-center my-2">
                <div className="w-36 h-36 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
                  <div className="w-32 h-32 rounded-full border-4 border-emerald-400/40 flex flex-col items-center justify-center bg-slate-950/80">
                    <span className="text-4xl font-black text-emerald-400 drop-shadow">{orgData?.overall_esg_score}</span>
                    <span className="text-[10px] text-slate-400 font-mono">out of 100</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Weighted index calculated across <span className="text-slate-200 font-semibold">{orgData?.department_count} active departments</span>.
              </p>
            </div>

            {/* Pillar Breakdown Cards */}
            <div className="lg:col-span-2 space-y-3 flex flex-col justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Pillar Performance Averages</h3>
              {getPillarBadge(orgData?.pillar_averages?.environmental || 0, 'Environmental Score', <Leaf className="w-4 h-4 text-emerald-400" />)}
              {getPillarBadge(orgData?.pillar_averages?.social || 0, 'Social Score', <Users className="w-4 h-4 text-sky-400" />)}
              {getPillarBadge(orgData?.pillar_averages?.governance || 0, 'Governance Score', <ShieldCheck className="w-4 h-4 text-purple-400" />)}
            </div>
          </div>

          {/* Department Score Leaderboard */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Department Score Leaderboard
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Ranked by Total Weighted ESG Score (0 - 100)</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Env Score</th>
                    <th className="py-3 px-4 text-center">Social Score</th>
                    <th className="py-3 px-4 text-center">Gov Score</th>
                    <th className="py-3 px-4 text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {deptScores.map((dept) => (
                    <tr key={dept.department_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{dept.rank}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-200">{dept.department_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{dept.department_code} • Head: {dept.head}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-semibold">{dept.scores.environmental}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-sky-400 font-semibold">{dept.scores.social}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-purple-400 font-semibold">{dept.scores.governance}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold ${getScoreColor(dept.scores.total)}`}>
                          {dept.scores.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Grid: Trend & Top Gamification Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Score Trend */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" /> Historical ESG Score Trend
              </h3>
              <div className="flex items-end justify-between gap-2 h-40 pt-4 px-2">
                {orgData?.trend?.map((t) => (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-400 transition-colors">{t.score}</span>
                    <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-28">
                      <div
                        className="w-full bg-emerald-500/60 group-hover:bg-emerald-400 transition-all rounded-t-lg"
                        style={{ height: `${t.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">{t.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers (Gamification Preview) */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Top Gamification Champions
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Spendable & Lifetime XP</span>
              </div>

              <div className="space-y-2.5">
                {topPerformers.map((user, idx) => (
                  <div key={user.user_id || user.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-slate-100'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{user.user_name || user.full_name || user.user_email || 'Champion'}</p>
                        <p className="text-[10px] text-slate-500">{user.department || user.department_name || 'EcoSphere Member'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-400 font-mono">{user.points || 0} pts</p>
                      <p className="text-[10px] text-slate-500 font-mono">{user.lifetime_points_earned || 0} XP lifetime</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OrganizationDashboard
