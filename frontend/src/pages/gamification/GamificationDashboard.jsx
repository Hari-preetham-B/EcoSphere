import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import {
  Trophy, Zap, Star, Medal, TrendingUp, Users,
  CheckCircle2, Target, Gift, ArrowRight, Crown
} from 'lucide-react'

const GamificationDashboard = () => {
  const { token, role } = useAuth()
  const isManager = role === 'Admin' || role === 'ESG Manager'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const d = await api.get('/gamification/dashboard', token)
      setData(d)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading Gamification Hub...</div>
  )

  const rankSuffix = (n) => {
    if (!n) return '—'
    if (n === 1) return '🥇 1st'
    if (n === 2) return '🥈 2nd'
    if (n === 3) return '🥉 3rd'
    return `#${n}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
            Gamification Hub
          </span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">Leaderboard & Rewards</h1>
          <p className="text-xs text-slate-400 mt-1">
            Earn XP by completing ESG challenges and CSR activities. Unlock badges and redeem rewards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/gamification/challenges"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/30 flex items-center gap-2"
          >
            <Target className="w-4 h-4" /> View Challenges
          </Link>
          <Link
            to="/gamification/rewards"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2"
          >
            <Gift className="w-4 h-4" /> Redeem Rewards
          </Link>
        </div>
      </div>

      {/* Personal Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Spendable Points', value: data?.my_points ?? 0,
            icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
            sub: `${data?.my_lifetime_points ?? 0} lifetime XP earned`
          },
          {
            label: 'Badges Earned', value: data?.my_badges_count ?? 0,
            icon: Medal, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20',
            sub: 'Auto-awarded on unlock'
          },
          {
            label: 'Challenges Done', value: data?.my_approved_challenges ?? 0,
            icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
            sub: `${data?.my_approved_csr ?? 0} CSR activities`
          },
          {
            label: 'Your Rank', value: rankSuffix(data?.my_rank),
            icon: Crown, color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
            sub: 'Among all employees'
          },
        ].map(({ label, value, icon: Icon, color, bg, border, sub }) => (
          <div key={label} className={`glass-card p-5 rounded-2xl border ${border} space-y-2`}>
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${bg} border ${border}`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-xs text-slate-400 font-semibold">{label}</p>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-[11px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Manager Alert: pending approvals */}
      {isManager && (data?.pending_approvals ?? 0) > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-amber-300 font-medium">
            <Star className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span>
              <strong className="text-amber-200">{data.pending_approvals} challenge submission{data.pending_approvals > 1 ? 's' : ''}</strong> awaiting your review and approval.
            </span>
          </div>
          <Link
            to="/gamification/challenges"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Two column: Leaderboard + Earned Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Leaderboard */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Top Leaderboard
            </h2>
            <Link to="/gamification" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
              Full board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {(data?.top5_leaderboard || []).map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                  entry.rank === 1 ? 'bg-amber-500/10 border border-amber-500/20' :
                  entry.rank === 2 ? 'bg-slate-500/10 border border-slate-600/30' :
                  entry.rank === 3 ? 'bg-orange-500/10 border border-orange-500/20' :
                  'bg-slate-900/40 border border-slate-800'
                }`}
              >
                <span className="text-lg font-extrabold w-8 shrink-0 text-center">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 text-xs truncate">{entry.user_name}</p>
                  <p className="text-[11px] text-slate-500">{entry.badges_count} badge{entry.badges_count !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-amber-400 font-bold text-sm">{entry.points}</span>
                  <span className="text-slate-500 text-[10px] ml-1">pts</span>
                </div>
              </div>
            ))}
            {(!data?.top5_leaderboard || data.top5_leaderboard.length === 0) && (
              <p className="text-center text-slate-500 text-xs py-6">No employee data yet.</p>
            )}
          </div>
        </div>

        {/* My Badges */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-100 flex items-center gap-2">
              <Medal className="w-5 h-5 text-purple-400" /> My Badges
            </h2>
            <Link to="/gamification/badges" className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
              All badges <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(data?.my_badges || []).length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <span className="text-4xl">🔒</span>
              <p className="text-slate-400 text-xs">Complete challenges or CSR activities to unlock your first badge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(data?.my_badges || []).map(ub => (
                <div
                  key={ub.badge_id}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center"
                >
                  <span className="text-3xl">{ub.badge_icon}</span>
                  <p className="text-[11px] font-bold text-purple-200 leading-tight">{ub.badge_name}</p>
                  <p className="text-[10px] text-slate-500">{ub.awarded_at?.split('T')[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span><strong className="text-slate-200">{data?.active_challenges ?? 0}</strong> Active Challenges</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Lifetime XP: <strong className="text-emerald-400">{data?.my_lifetime_points ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Rank: <strong className="text-amber-300">{rankSuffix(data?.my_rank)}</strong></span>
          </div>
          <p className="text-slate-600 text-[11px] ml-auto italic">
            Badge thresholds use lifetime XP — redeeming rewards never reduces badge progress.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GamificationDashboard
