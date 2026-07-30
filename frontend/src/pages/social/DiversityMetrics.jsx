import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Modal from '../../components/common/Modal'
import { Users, Plus, BarChart3, PieChart, Building2, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts'

const GENDER_COLORS = ['#3b82f6', '#ec4899', '#a855f7']

const DiversityMetrics = () => {
  const { token, role } = useAuth()
  const [metrics, setMetrics] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    department_id: '',
    year: new Date().getFullYear(),
    male_pct: 45,
    female_pct: 50,
    other_pct: 5,
    age_under30: 12,
    age_30to50: 25,
    age_over50: 8,
  })

  const canManage = role === 'Admin' || role === 'ESG Manager'

  const fetchData = async () => {
    try {
      setLoading(true)
      const [mRes, dRes] = await Promise.all([
        api.get(`/diversity?year=${selectedYear}`, token),
        api.get('/departments', token),
      ])
      setMetrics(mRes)
      setDepartments(dRes)
    } catch (err) {
      setError(err.message || 'Failed to load diversity metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchData()
  }, [token, selectedYear])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      await api.post('/diversity', token, {
        department_id: parseInt(formData.department_id),
        year: parseInt(formData.year),
        male_pct: parseFloat(formData.male_pct),
        female_pct: parseFloat(formData.female_pct),
        other_pct: parseFloat(formData.other_pct),
        age_under30: parseInt(formData.age_under30),
        age_30to50: parseInt(formData.age_30to50),
        age_over50: parseInt(formData.age_over50),
      })
      setSuccess('Diversity metrics saved successfully!')
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      setError(err.message || 'Failed to save diversity record')
    }
  }

  // Aggregate overall gender distribution for Pie Chart
  const overallGender = metrics.reduce(
    (acc, m) => {
      acc.male += m.male_pct
      acc.female += m.female_pct
      acc.other += m.other_pct
      return acc
    },
    { male: 0, female: 0, other: 0 }
  )

  const totalCount = metrics.length || 1
  const pieData = [
    { name: 'Male %', value: Math.round(overallGender.male / totalCount) },
    { name: 'Female %', value: Math.round(overallGender.female / totalCount) },
    { name: 'Other %', value: Math.round(overallGender.other / totalCount) },
  ]

  // Department stacked bar chart data
  const deptBarData = metrics.map((m) => ({
    name: m.department_name || `Dept #${m.department_id}`,
    Male: m.male_pct,
    Female: m.female_pct,
    Other: m.other_pct,
  }))

  // Age distribution bar chart data
  const ageBarData = metrics.map((m) => ({
    name: m.department_name || `Dept #${m.department_id}`,
    '<30 Years': m.age_under30,
    '30-50 Years': m.age_30to50,
    '>50 Years': m.age_over50,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
            <Users className="w-4 h-4" /> Social ESG Module
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Diversity & Inclusion Metrics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Departmental gender ratios and age distribution metrics across the organisation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
          >
            {[2026, 2025, 2024].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Add / Update Metrics
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading Diversity Metrics...</div>
      ) : metrics.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-semibold">No Diversity Metrics for {selectedYear}</h3>
          <p className="text-slate-500 text-sm mt-1">
            {canManage ? 'Click "Add / Update Metrics" to record gender ratios and age brackets by department.' : 'No data recorded for this year.'}
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gender Ratio Pie Chart */}
            <div className="bg-slate-900/60 border border-slate-800/90 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" /> Overall Gender Balance (%)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Gender Stacked Bar Chart */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/90 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Gender Ratio by Department (%)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptBarData}>
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    />
                    <Legend />
                    <Bar dataKey="Male" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Other" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Age Distribution Bar Chart */}
          <div className="bg-slate-900/60 border border-slate-800/90 p-5 rounded-2xl">
            <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Age Brackets (Headcount per Department)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageBarData}>
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  />
                  <Legend />
                  <Bar dataKey="<30 Years" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="30-50 Years" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey=">50 Years" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Department Diversity Metrics">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
              <select
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Year *</label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Gender Ratio Breakdown (%)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Male %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.male_pct}
                  onChange={(e) => setFormData({ ...formData, male_pct: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Female %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.female_pct}
                  onChange={(e) => setFormData({ ...formData, female_pct: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Other %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.other_pct}
                  onChange={(e) => setFormData({ ...formData, other_pct: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Age Distribution (Headcount)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Under 30</label>
                <input
                  type="number"
                  value={formData.age_under30}
                  onChange={(e) => setFormData({ ...formData, age_under30: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">30 to 50</label>
                <input
                  type="number"
                  value={formData.age_30to50}
                  onChange={(e) => setFormData({ ...formData, age_30to50: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Over 50</label>
                <input
                  type="number"
                  value={formData.age_over50}
                  onChange={(e) => setFormData({ ...formData, age_over50: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition-all"
            >
              Save Metrics
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DiversityMetrics
