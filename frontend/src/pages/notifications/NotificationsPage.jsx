import React, { useState, useEffect } from 'react'
import { apiGet, apiPut } from '../../utils/api'
import { Bell, CheckCheck, Clock } from 'lucide-react'

const TYPE_META = {
  compliance_issue: { icon: '⚠️', label: 'Compliance', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  csr_decision:    { icon: '✅', label: 'CSR / Challenge', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  policy_reminder: { icon: '📋', label: 'Policy Reminder', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  badge_unlock:    { icon: '🏅', label: 'Badge Unlocked', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  general:         { icon: '🔔', label: 'General', color: 'text-slate-400 bg-slate-800 border-slate-700' },
}

const getMeta = (type) => TYPE_META[type] || TYPE_META.general

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const data = await apiGet('/notifications')
      setNotifications(data.notifications || [])
    } catch (e) {
      console.error('Failed to load notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    await apiPut(`/notifications/${id}/read`, {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await apiPut('/notifications/read-all', {})
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" /> Notifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">{unreadCount} unread</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              filter === f ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading notifications...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(n => {
            const meta = getMeta(n.type)
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  !n.is_read ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-900/30 border-slate-800'
                }`}
              >
                <span className="text-2xl mt-0.5 select-none">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${meta.color}`}>{meta.label}</span>
                    {!n.is_read && <span className="text-[10px] text-emerald-400 font-semibold">NEW</span>}
                  </div>
                  <p className={`text-sm font-semibold mt-1 ${!n.is_read ? 'text-slate-100' : 'text-slate-400'}`}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </span>
                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >Mark read</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
