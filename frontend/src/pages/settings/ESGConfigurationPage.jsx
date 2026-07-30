import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Sliders, Loader2, Save } from 'lucide-react'

const SETTINGS_META = {
  auto_emission_calc: {
    label: 'Auto Emission Calculation',
    desc: 'Automatically calculate CO₂ emissions when carbon transactions are created using stored emission factors',
    section: 'Environmental'
  },
  require_proof_for_csr: {
    label: 'Require Proof for CSR Approval',
    desc: 'Prevent approving CSR participation unless a supporting document or image is uploaded',
    section: 'Social'
  },
  badge_auto_award: {
    label: 'Badge Auto-Award',
    desc: 'Automatically award badges to employees when they meet unlock criteria (points, challenges, CSR)',
    section: 'Gamification'
  },
  weight_env: {
    label: 'Environmental ESG Weight',
    desc: 'Weight applied to the Environmental pillar score in the overall ESG score (0.0 – 1.0)',
    section: 'ESG Weights',
    isNumber: true
  },
  weight_soc: {
    label: 'Social ESG Weight',
    desc: 'Weight applied to the Social pillar score in the overall ESG score (0.0 – 1.0)',
    section: 'ESG Weights',
    isNumber: true
  },
  weight_gov: {
    label: 'Governance ESG Weight',
    desc: 'Weight applied to the Governance pillar score in the overall ESG score (0.0 – 1.0)',
    section: 'ESG Weights',
    isNumber: true
  },
}

const SECTIONS = ['Environmental', 'Social', 'Gamification', 'ESG Weights']

export default function ESGConfigurationPage() {
  const { token } = useAuth()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/settings', token)
      .then(data => setSettings(data || {}))
      .finally(() => setLoading(false))
  }, [])

  const setBool = (key) => {
    setSettings(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))
    setSaved(false)
  }

  const setNum = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  const save = async () => {
    const newErrors = {}
    const weights = ['weight_env', 'weight_soc', 'weight_gov']
    let total = 0
    for (const w of weights) {
      const v = parseFloat(settings[w] || 0)
      if (isNaN(v) || v < 0 || v > 1) newErrors[w] = 'Must be between 0.0 and 1.0'
      total += v
    }
    if (!newErrors.weight_env && !newErrors.weight_soc && !newErrors.weight_gov) {
      if (Math.abs(total - 1.0) > 0.01) {
        newErrors.weight_env = `Weights must sum to 1.0 (currently ${total.toFixed(2)})`
      }
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      await api.put('/settings', token, settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Failed to save ESG settings:', e)
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
          <Sliders className="w-6 h-6 text-emerald-400" /> ESG Configuration
        </h1>
        <p className="text-slate-400 text-sm mt-1">Global platform settings for ESG scoring and module behavior</p>
      </div>

      {SECTIONS.map(section => {
        const sectionKeys = Object.entries(SETTINGS_META).filter(([, v]) => v.section === section)
        return (
          <div key={section} className="mb-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{section}</h2>
            <div className="space-y-3">
              {sectionKeys.map(([key, meta]) => (
                <div key={key} className={`p-4 rounded-2xl bg-slate-900/60 border ${errors[key] ? 'border-rose-500/40' : 'border-slate-800'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-200">{meta.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                      {errors[key] && <p className="text-xs text-rose-400 mt-1">{errors[key]}</p>}
                    </div>
                    {meta.isNumber ? (
                      <input
                        type="number"
                        min="0" max="1" step="0.05"
                        value={settings[key] || ''}
                        onChange={e => setNum(key, e.target.value)}
                        className="w-24 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm text-right focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <button
                        onClick={() => setBool(key)}
                        className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${settings[key] === 'true' ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings[key] === 'true' ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </button>
        {saved && <span className="text-sm text-emerald-400">✓ Saved</span>}
      </div>
    </div>
  )
}