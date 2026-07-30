import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { FileText, Download, Filter, RefreshCw, AlertCircle, Table as TableIcon, CheckCircle2, ShieldCheck, Leaf, Users, Calendar, Tag, UserCheck, Target } from 'lucide-react'

const ReportsPage = () => {
  const { token } = useAuth()

  const [reportType, setReportType] = useState('summary')

  // All 6 Distinct Filter Types:
  // 1. Department
  // 2. Date Range (Date From + Date To)
  // 3. Module (Environmental / Social / Governance / Gamification)
  // 4. Employee
  // 5. Challenge
  // 6. ESG Category
  const [departmentId, setDepartmentId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [userId, setUserId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  // Dropdown reference lists
  const [departments, setDepartments] = useState([])
  const [usersList, setUsersList] = useState([])
  const [challenges, setChallenges] = useState([])
  const [categories, setCategories] = useState([])

  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  // Load dropdown options
  useEffect(() => {
    Promise.all([
      api.get('/departments', token).catch(() => []),
      api.get('/users', token).catch(() => []),
      api.get('/gamification/challenges', token).catch(() => []),
      api.get('/categories', token).catch(() => []),
    ]).then(([deptsRes, usersRes, challsRes, catsRes]) => {
      setDepartments(deptsRes || [])
      setUsersList(usersRes || [])
      setChallenges(challsRes || [])
      setCategories(catsRes || [])
    })
  }, [token])

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      params.append('type', reportType)
      if (selectedModule) params.append('module', selectedModule)
      if (departmentId) params.append('department_id', departmentId)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (userId) params.append('user_id', userId)
      if (challengeId) params.append('challenge_id', challengeId)
      if (categoryId) params.append('category_id', categoryId)

      const res = await api.get(`/scoring/reports/fixed?${params.toString()}`, token)
      setReportData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, reportType, selectedModule, departmentId, dateFrom, dateTo, userId, challengeId, categoryId])

  useEffect(() => { loadReport() }, [loadReport])

  const handleClearFilters = () => {
    setDepartmentId('')
    setDateFrom('')
    setDateTo('')
    setSelectedModule('')
    setUserId('')
    setChallengeId('')
    setCategoryId('')
  }

  const handleExport = async (format) => {
    if (!reportData || !reportData.data) return
    try {
      setExporting(true)
      const res = await fetch(`http://localhost:5000/api/scoring/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          format: format,
          report_type: reportType,
          rows: reportData.data
        })
      })

      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `EcoSphere_${selectedModule || reportType}_Report.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      alert(`Export error: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  const REPORT_TABS = [
    { id: 'summary', name: 'ESG Executive Summary', icon: TableIcon },
    { id: 'environmental', name: 'Environmental Report', icon: Leaf },
    { id: 'social', name: 'Social Report', icon: Users },
    { id: 'governance', name: 'Governance Report', icon: ShieldCheck },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">Reports & Analytics</span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">ESG Fixed & Custom Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Filter, inspect, and export comprehensive audit-ready reports across all 6 distinct filter types.
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm">
            <Download className="w-3.5 h-3.5 text-emerald-400" /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting || loading}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm">
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting || loading}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-purple-600/20">
            <Download className="w-3.5 h-3.5 text-white" /> PDF
          </button>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon
          const active = reportType === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setReportType(tab.id); setSelectedModule(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                active ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Full 6-Filter Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" /> Custom Filter Builder (6 Filter Types)
          </span>
          <button
            onClick={handleClearFilters}
            className="text-[11px] text-slate-500 hover:text-purple-400 font-semibold underline transition-colors">
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
          {/* Filter 1: Department */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">1. Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-purple-500">
              <option value="">All Depts</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: Date Range (From + To) */}
          <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">2. Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-purple-500 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-purple-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Filter 3: Module */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-purple-400 mb-1">3. Module Filter</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full bg-slate-950 border border-purple-500/50 text-purple-200 font-semibold rounded-xl px-2 py-2 focus:outline-none focus:border-purple-400">
              <option value="">All Modules</option>
              <option value="Environmental">Environmental</option>
              <option value="Social">Social</option>
              <option value="Governance">Governance</option>
              <option value="Gamification">Gamification</option>
            </select>
          </div>

          {/* Filter 4: Employee */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">4. Employee</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-purple-500">
              <option value="">All Employees</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>

          {/* Filter 5: Challenge */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">5. Challenge</label>
            <select
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-purple-500">
              <option value="">All Challenges</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Filter 6: ESG Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">6. ESG Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-purple-500">
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Report Content Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Generating report preview...</div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">{reportData?.report_name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total records: <span className="text-purple-400 font-mono font-semibold">{reportData?.record_count || 0}</span> • Filtered results ready for download
              </p>
            </div>
            <button
              onClick={loadReport}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {reportData?.data && reportData.data.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    {Object.keys(reportData.data[0]).map((key) => (
                      <th key={key} className="py-3 px-4">{key.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {reportData.data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="py-3 px-4 font-mono text-[11px] max-w-xs truncate">
                          {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">No records matching selected criteria.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage
