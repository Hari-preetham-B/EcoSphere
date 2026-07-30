import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts'
import { Leaf, TrendingUp, Target, Building2, AlertCircle } from 'lucide-react'

const PALETTE = ['#10b981', '#14b8a6', '#06b6d4', '#22d3ee', '#34d399', '#6ee7b7', '#99f6e4', '#a7f3d0']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#10b981' }} className="font-mono font-bold">{p.name}: {Number(p.value).toFixed(2)} t</p>
      ))}
    </div>
  )
}

export default function EnvironmentalDashboard() {
  const { token } = useAuth()
  const [deptSummary, setDeptSummary] = useState([])
  const [trend, setTrend] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentYear = new Date().getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dept, tr, gl] = await Promise.all([
        api.get('/carbon-transactions/department-summary', token),
        api.get(`/carbon-transactions/trend?year=${currentYear}`, token),
        api.get('/sustainability-goals', token),
      ])
      setDeptSummary(dept)
      setTrend(tr)
      setGoals(gl)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token, currentYear])

  useEffect(() => { load() }, [load])

  const totalCo2e = deptSummary.reduce((a, b) => a + b.total_co2e, 0)
  const totalTxns = deptSummary.reduce((a, b) => a + b.transaction_count, 0)
  const activeGoals = goals.filter(g => g.status === 'Active').length
  const achievedGoals = goals.filter(g => g.status === 'Achieved').length

  // Radial chart data from goals
  const goalProgress = goals.slice(0, 5).map((g, i) => ({
    name: g.name.length > 22 ? g.name.slice(0, 22) + '…' : g.name,
    value: g.progress_pct || 0,
    fill: PALETTE[i % PALETTE.length],
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading environmental data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20">
            <Leaf className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Environmental Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">Emissions overview · {currentYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">Live Data</span>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total CO₂e', value: `${totalCo2e.toFixed(1)} t`, sub: 'All time', icon: Leaf, color: 'text-emerald-400' },
          { label: 'Transactions', value: totalTxns, sub: 'Recorded', icon: TrendingUp, color: 'text-teal-400' },
          { label: 'Active Goals', value: activeGoals, sub: `${achievedGoals} achieved`, icon: Target, color: 'text-cyan-400' },
          { label: 'Departments', value: deptSummary.length, sub: 'Tracked', icon: Building2, color: 'text-emerald-300' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-panel rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Emissions by Department – Bar Chart */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" /> Emissions by Department
          </h2>
          {deptSummary.filter(d => d.total_co2e > 0).length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">No emission data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptSummary.filter(d => d.total_co2e > 0)} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="department_name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_co2e" name="CO₂e (t)" radius={[4, 4, 0, 0]}>
                  {deptSummary.filter(d => d.total_co2e > 0).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Trend – Line Chart */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" /> Monthly Trend ({currentYear})
          </h2>
          {trend.every(t => t.co2e === 0) ? (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">No transactions this year yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="co2e"
                  name="CO₂e (t)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ r: 5, fill: '#34d399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Goal Progress – Radial Chart */}
      {goalProgress.length > 0 && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" /> Goal Progress Overview
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={240}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                data={goalProgress}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  minAngle={5}
                  dataKey="value"
                  cornerRadius={4}
                  background={{ fill: '#1e293b' }}
                />
                <Legend
                  iconSize={8}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
                        <p className="text-slate-200 font-semibold">{payload[0].payload.name}</p>
                        <p className="text-emerald-400 font-mono font-bold">{payload[0].value.toFixed(1)}% complete</p>
                      </div>
                    ) : null
                  }
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
