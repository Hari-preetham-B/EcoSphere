import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { FileText, Download, Filter, RefreshCw, AlertCircle, Table as TableIcon, CheckCircle2, ShieldCheck, Leaf, Users } from 'lucide-react'

const ReportsPage = () => {
  const { token } = useAuth()

  const [reportType, setReportType] = useState('summary')
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  // Load available departments for filtering
  useEffect(() => {
    api.get('/departments', token).then(setDepartments).catch(() => {})
  }, [token])

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      let path = `/reports/fixed?type=${reportType}`
      if (selectedDept) path += `&department_id=${selectedDept}`
      const res = await api.get(path, token)
      setReportData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, reportType, selectedDept])

  useEffect(() => { loadReport() }, [loadReport])

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
      a.download = `EcoSphere_${reportType}_Report.${format === 'excel' ? 'xlsx' : format}`
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
    { id: 'summary', name: 'ESG Summary Report', icon: TableIcon },
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
            Filter, inspect, and export comprehensive audit-ready environmental, social, and governance reports.
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

      {/* Tabs & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Report Type Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon
            const active = reportType === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  active ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-slate-200'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500">
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadReport}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
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
                Total records: <span className="text-purple-400 font-mono font-semibold">{reportData?.record_count || 0}</span> • Generated at: {new Date(reportData?.generated_at).toLocaleString()}
              </p>
            </div>
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
