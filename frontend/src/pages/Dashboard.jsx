import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/common/Badge'
import { Link } from 'react-router-dom'
import {
  Building2,
  Tags,
  Users,
  Leaf,
  ShieldCheck,
  Trophy,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCog
} from 'lucide-react'

const Dashboard = () => {
  const { profile, role, token, user } = useAuth()
  const [stats, setStats] = useState({
    departmentsCount: 0,
    categoriesCount: 0,
    activeCategories: 0,
    usersCount: 0
  })
  const [loading, setLoading] = useState(true)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!token) return
      try {
        const [deptRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/departments`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
        ])

        const depts = deptRes.ok ? await deptRes.json() : []
        const cats = catRes.ok ? await catRes.json() : []

        setStats({
          departmentsCount: depts.length,
          categoriesCount: cats.length,
          activeCategories: cats.filter(c => c.status === 'Active').length,
          usersCount: 1 // default display fallback
        })
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [token])

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden glass-panel p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-emerald-950/20">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
          <Leaf className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              Welcome back
            </span>
            <Badge role={role} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Hello, {displayName}!
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base leading-relaxed">
            Welcome to <strong className="text-emerald-400">EcoSphere</strong>, your centralized platform for Environmental, Social, and Governance management, sustainability metrics, and CSR compliance.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Departments
            </span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3">
            {loading ? '-' : stats.departmentsCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Configured organizational units</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CSR Categories
            </span>
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl">
              <Tags className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3">
            {loading ? '-' : stats.categoriesCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">{stats.activeCategories} active categories</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ESG Compliance Score
            </span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3">
            92<span className="text-lg text-emerald-400">/100</span>
          </div>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <Activity className="w-3.5 h-3.5" /> Grade A Target
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Permission
            </span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-100 mt-3 flex items-center gap-2">
            <Badge role={role} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {role === 'Admin' ? 'Full Master Data & User Access' : 'Standard Employee Access'}
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Platform Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/environmental"
            className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/50"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                Environmental (E)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Carbon footprint tracking, energy consumption audits, greenhouse gas reporting, and waste reduction goals.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-400 mt-6 gap-1 group-hover:gap-2 transition-all">
              Explore Module <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/social"
            className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-teal-500/50"
          >
            <div>
              <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                Social Responsibility (S)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                CSR community activities, employee well-being initiatives, workplace diversity, and safety protocols.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-teal-400 mt-6 gap-1 group-hover:gap-2 transition-all">
              Explore Module <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/governance"
            className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-purple-500/50"
          >
            <div>
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
                Corporate Governance (G)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Board oversight, ethics policy compliance, stakeholder transparency, and anti-corruption audit trails.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-purple-400 mt-6 gap-1 group-hover:gap-2 transition-all">
              Explore Module <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Admin Master Data Shortcuts */}
      {role === 'Admin' && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-950/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-purple-200 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-purple-400" /> Admin Master Data & RBAC Controls
            </h3>
            <span className="text-xs text-purple-400 bg-purple-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              Admin Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/departments"
              className="p-4 bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-bold text-slate-200">Departments</div>
                  <div className="text-xs text-slate-500">Manage structure & heads</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link
              to="/categories"
              className="p-4 bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <Tags className="w-5 h-5 text-teal-400" />
                <div>
                  <div className="text-sm font-bold text-slate-200">Categories</div>
                  <div className="text-xs text-slate-500">CSR & Challenge types</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link
              to="/users"
              className="p-4 bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm font-bold text-slate-200">User Roles</div>
                  <div className="text-xs text-slate-500">Promote/demote user access</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
