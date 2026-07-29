import React from 'react'
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
  ShieldCheck
} from 'lucide-react'

const Sidebar = () => {
  const { role } = useAuth()

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Environmental', path: '/environmental', icon: Leaf },
    { name: 'Social', path: '/social', icon: Users },
    { name: 'Governance', path: '/governance', icon: ShieldCheck },
    { name: 'Gamification', path: '/gamification', icon: Trophy },
    { name: 'Reports', path: '/reports', icon: FileText },
  ]

  const adminNav = [
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'User & Roles', path: '/users', icon: UserCog },
  ]

  const systemNav = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const renderLink = (item) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.path}
        to={item.path}
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
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
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

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Core Modules
          </div>
          <div className="space-y-1">{mainNav.map(renderLink)}</div>
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
  )
}

export default Sidebar
