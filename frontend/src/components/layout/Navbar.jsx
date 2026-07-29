import React from 'react'
import { useAuth } from '../../context/AuthContext'
import Badge from '../common/Badge'
import { LogOut, User } from 'lucide-react'

const Navbar = () => {
  const { profile, role, user, signOut } = useAuth()

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const email = profile?.email || user?.email || ''

  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-400">Environment:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Production (Supabase)
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info Card */}
        <div className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-slate-200 font-bold text-xs uppercase shadow-inner">
            {displayName.charAt(0)}
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">{displayName}</span>
              <Badge role={role} />
            </div>
            <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{email}</span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

export default Navbar
