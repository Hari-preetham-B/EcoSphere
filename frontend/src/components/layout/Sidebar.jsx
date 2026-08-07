import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Building2,
  Tags,
  Leaf,
  Users,
  Trophy,
  FileText,
  Settings,
  UserCog,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Zap,
  Target,
  FlaskConical,
  HeartHandshake,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  Gift,
  Medal,
  BarChart3,
  Bell,
  BellRing,
  Sliders,
  X,
} from 'lucide-react'

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { role } = useAuth()
  const [envOpen, setEnvOpen] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)
  const [govOpen, setGovOpen] = useState(false)
  const [gamOpen, setGamOpen] = useState(false)

  const canEditEnv = role === 'Admin' || role === 'ESG Manager'
  const isManager = role === 'Admin' || role === 'ESG Manager'

  const adminNav = [
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'User & Roles', path: '/users', icon: UserCog },
  ]

  const systemNav = [
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Notification Settings', path: '/settings/notifications', icon: BellRing, adminOnly: true },
    { name: 'ESG Configuration', path: '/settings/esg', icon: Sliders, adminOnly: true },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const handleNavClick = () => {
    if (setMobileMenuOpen) setMobileMenuOpen(false)
  }

  const renderLink = (item) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={handleNavClick}
        className={({ isActive }) =>
          `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`
        }
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{item.name}</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 shrink-0 select-none transition-transform duration-300 z-50 ${
          mobileMenuOpen
            ? 'fixed inset-y-0 left-0 translate-x-0'
            : 'hidden lg:flex'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Leaf className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-100 tracking-tight leading-none">
                EcoSphere
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400">
                ESG Platform
              </span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Core Modules
          </div>
          <div className="space-y-1">
            {/* Dashboard */}
            {renderLink({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard })}

            {/* Environmental – collapsible */}
            <div>
              <button
                onClick={() => setEnvOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  envOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Leaf className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Environmental</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${envOpen ? 'rotate-180 text-emerald-400' : 'text-slate-600'}`} />
              </button>

              {envOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                  {renderLink({ name: 'Executive Dashboard', path: '/scoring', icon: BarChart3 })}
                  {renderLink({ name: 'Environmental', path: '/environmental', icon: Leaf })}
                  {renderLink({ name: 'Transactions', path: '/environmental/transactions', icon: Zap })}
                  {renderLink({ name: 'Goals', path: '/environmental/goals', icon: Target })}
                  {renderLink({ name: 'By Department', path: '/environmental/departments', icon: Building2 })}
                  {canEditEnv && renderLink({ name: 'Emission Factors', path: '/environmental/factors', icon: FlaskConical })}
                </div>
              )}
            </div>

            {/* Social – collapsible */}
            <div>
              <button
                onClick={() => setSocialOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  socialOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Social</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${socialOpen ? 'rotate-180 text-emerald-400' : 'text-slate-600'}`} />
              </button>

              {socialOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                  {renderLink({ name: 'CSR Activities', path: '/social/activities', icon: Users })}
                  {renderLink({ name: 'My Participations', path: '/social/my-participations', icon: HeartHandshake })}
                  {isManager && renderLink({ name: 'CSR Approvals', path: '/social/approvals', icon: ShieldCheck })}
                  {renderLink({ name: 'Diversity & Inclusion', path: '/social/diversity', icon: Building2 })}
                  {renderLink({ name: 'Training Tracking', path: '/social/training', icon: Trophy })}
                </div>
              )}
            </div>

            {/* Governance – collapsible */}
            <div>
              <button
                onClick={() => setGovOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  govOpen ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Governance</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${govOpen ? 'rotate-180 text-purple-400' : 'text-slate-600'}`} />
              </button>

              {govOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                  {renderLink({ name: 'Governance Overview', path: '/governance', icon: ShieldCheck })}
                  {renderLink({ name: 'ESG Policies', path: '/governance/policies', icon: FileCheck })}
                  {renderLink({ name: 'Department Audits', path: '/governance/audits', icon: ClipboardList })}
                  {renderLink({ name: 'Compliance Issues', path: '/governance/issues', icon: AlertTriangle })}
                </div>
              )}
            </div>

            {/* Gamification – collapsible */}
            <div>
              <button
                onClick={() => setGamOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  gamOpen ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Gamification</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${gamOpen ? 'rotate-180 text-amber-400' : 'text-slate-600'}`} />
              </button>

              {gamOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                  {renderLink({ name: 'Leaderboard', path: '/gamification', icon: Trophy })}
                  {renderLink({ name: 'Challenges', path: '/gamification/challenges', icon: Target })}
                  {renderLink({ name: 'Rewards Catalog', path: '/gamification/rewards', icon: Gift })}
                  {renderLink({ name: 'Badges', path: '/gamification/badges', icon: Medal })}
                </div>
              )}
            </div>

            {renderLink({ name: 'Reports', path: '/reports', icon: FileText })}
          </div>
        </div>

        {/* Master Data Section (Admin Only) */}
        {role === 'Admin' && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-400">
              <span>Admin Master Data</span>
              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded text-[9px]">Admin</span>
            </div>
            <div className="space-y-1">{adminNav.map(renderLink)}</div>
          </div>
        )}

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            System
          </div>
          <div className="space-y-1">{systemNav.map(renderLink)}</div>
        </div>
      </div>
    </aside>
  </>
  )
}

export default Sidebar
