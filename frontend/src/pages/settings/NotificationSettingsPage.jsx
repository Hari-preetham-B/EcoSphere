import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { BellRing, Mail, Loader2, Save } from 'lucide-react'

const EVENT_LABELS = {
  compliance_issue: { label: 'Compliance Issues', desc: 'When a new compliance issue is assigned to you', icon: '⚠️' },
  csr_decision: { label: 'CSR & Challenge Decisions', desc: 'When your CSR or challenge submission is approved or rejected', icon: '✅' },
  policy_reminder: { label: 'Policy Acknowledgement Reminders', desc: 'When you are reminded to acknowledge an ESG policy', icon: '📋' },
  badge_unlock: { label: 'Badge Unlocks', desc: 'When you earn a new badge', icon: '🏅' },
}

export default function NotificationSettingsPage() {
  const { token } = useAuth()
  const [prefs, setPrefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/settings/notifications', token)
      .then(data => setPrefs(data || []))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (event_type, field) => {
    setPrefs(prev =>
      prev.map(p => p.event_type === event_type ? { ...p, [field]: !p[field] } : p)
    )
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.put('/settings/notifications', token, prefs)
      setPrefs(updated || prefs)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Failed to save notification settings:', e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-amber-400" /> Notification Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Admin control: toggle in-app and email delivery per event type</p>
      </div>

      <div className="space-y-3">
        {prefs.map(p => {
          const meta = EVENT_LABELS[p.event_type] || { label: p.event_type, desc: '', icon: '🔔' }
          return (
            <div key={p.event_type} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{meta.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{meta.label}</p>
                  <p className="text-xs text-slate-500">{meta.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 pl-1">
                {/* In-App Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    onClick={() => toggle(p.event_type, 'in_app_enabled')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${p.in_app_enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.in_app_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-xs text-slate-300 flex items-center gap-1"><BellRing className="w-3.5 h-3.5" /> In-App</span>
                </label>
                {/* Email Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    onClick={() => toggle(p.event_type, 'email_enabled')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${p.email_enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.email_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-xs text-slate-300 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Preferences
        </button>
        {saved && <span className="text-sm text-emerald-400">✓ Saved</span>}
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
        <p className="text-xs text-blue-300 font-medium">📧 Email Delivery Note</p>
        <p className="text-xs text-slate-400 mt-1">
          Email notifications require Brevo SMTP credentials configured in the backend <code className="text-slate-300">.env</code> file.
          Without valid credentials, in-app notifications will still be delivered. Email toggles will take effect once credentials are set.
        </p>
      </div>
    </div>
  )
}