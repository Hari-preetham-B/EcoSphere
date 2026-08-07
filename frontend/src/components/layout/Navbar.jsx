import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Badge from '../common/Badge'
import { LogOut, Bell, Menu } from 'lucide-react'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ onToggleMobileMenu }) => {
  const { profile, role, user, signOut, token } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showBell, setShowBell] = useState(false)
  const bellRef = useRef(null)

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const email = profile?.email || user?.email || ''

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications', token)
      setNotifications((data.notifications || []).slice(0, 6))
      setUnreadCount(data.unread_count || 0)
    } catch (_) { }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, token, {})
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (_) { }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all', token, {})
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (_) { }
  }

  const typeIcon = (type) => {
    const map = {
      compliance_issue: '⚠️', csr_decision: '✅', policy_reminder: '📋',
      badge_unlock: '🏅', general: '🔔'
    }
    return map[type] || '🔔'
  }

  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-xl lg:hidden cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Environment:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Production (Supabase)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowBell(v => !v)}
            title="Notifications"
            className="relative p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all border border-transparent hover:border-amber-500/20 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <span className="text-sm font-bold text-slate-200">Notifications</span>
                <button onClick={markAllRead} className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-6">No notifications yet</p>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { markRead(n.id); if (n.link) { navigate(n.link); setShowBell(false) } }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors cursor-pointer ${!n.is_read ? 'bg-slate-800/60' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">{typeIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${!n.is_read ? 'text-slate-100' : 'text-slate-400'}`}>{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { navigate('/notifications'); setShowBell(false) }}
                className="block w-full text-center text-xs text-emerald-400 hover:text-emerald-300 py-3 border-t border-slate-800 cursor-pointer transition-colors"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>

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