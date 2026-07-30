import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  ArrowRight,
  Send,
  AlertCircle,
  Plus
} from 'lucide-react'

const GovernanceDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/governance/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        throw new Error('Failed to load governance dashboard metrics')
      }
      const json = await response.json()
      setData(json)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Governance Dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
        {error}
      </div>
    )
  }

  const overdueList = data?.overdue_issues_list || []

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-400 shadow-lg shrink-0 shadow-purple-500/20">
            <ShieldCheck className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
              EcoSphere Core Module
            </span>
            <h1 className="text-3xl font-extrabold text-slate-100 mt-1">Corporate Governance (G)</h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Oversee ESG policies, monitor employee policy acknowledgements, track departmental audits, and enforce compliance issue resolutions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/governance/policies"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4 text-purple-400" />
            ESG Policies
          </Link>
          <Link
            to="/governance/audits"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            Audits
          </Link>
          <Link
            to="/governance/issues"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Compliance Issues
          </Link>
        </div>
      </div>

      {/* PROMINENT OVERDUE OPEN COMPLIANCE ISSUES ALERT BANNER */}
      {overdueList.length > 0 && (
        <div className="p-6 rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/60 shadow-xl shadow-red-950/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-200 flex items-center gap-2">
                  Urgent Governance Action Required
                  <span className="px-2.5 py-0.5 bg-red-500/30 text-red-300 rounded-full text-xs font-semibold">
                    {overdueList.length} Overdue {overdueList.length === 1 ? 'Issue' : 'Issues'}
                  </span>
                </h3>
                <p className="text-xs text-red-300/80">
                  Compliance issues past their due date requiring immediate owner remediation.
                </p>
              </div>
            </div>
            <Link
              to="/governance/issues?overdue_only=true"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30"
            >
              View All Issues <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-red-950/40 text-red-300 uppercase tracking-wider font-semibold border-b border-red-900/50">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Assigned Owner</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-950/30 font-medium">
                {overdueList.map(issue => (
                  <tr key={issue.id} className="hover:bg-red-900/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-100 max-w-xs truncate">
                      {issue.description}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{issue.department_name || 'Company-wide'}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">{issue.owner_name}</td>
                    <td className="py-2.5 px-3 font-mono text-red-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {issue.due_date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/40">
                        {issue.status} (OVERDUE)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Active ESG Policies</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3">
            {data?.active_policies || 0}
          </div>
          <span className="text-xs text-purple-400 mt-1 block font-medium">
            Out of {data?.total_policies || 0} total created
          </span>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Acknowledgement Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3">
            {data?.acknowledgement_rate_pct || 100}%
          </div>
          <span className="text-xs text-emerald-400 mt-1 block font-medium">
            Employee compliance benchmark
          </span>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Audits Completed</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3">
            {data?.completed_audits || 0}
          </div>
          <span className="text-xs text-indigo-400 mt-1 block font-medium">
            Out of {data?.total_audits || 0} total logged
          </span>
        </div>

        <div className={`glass-card p-6 rounded-2xl border relative overflow-hidden ${
          (data?.overdue_issues_count || 0) > 0 ? 'border-red-500/40 bg-red-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Open Compliance Issues</span>
            <div className={`p-2 rounded-xl border ${
              (data?.overdue_issues_count || 0) > 0
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3 flex items-baseline gap-2">
            {data?.open_issues_count || 0}
            {(data?.overdue_issues_count || 0) > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 bg-red-500/30 text-red-300 rounded">
                {data.overdue_issues_count} Overdue!
              </span>
            )}
          </div>
          <span className={`text-xs mt-1 block font-medium ${
            (data?.overdue_issues_count || 0) > 0 ? 'text-red-400 font-semibold' : 'text-slate-400'
          }`}>
            Total issues recorded: {data?.total_issues || 0}
          </span>
        </div>
      </div>

      {/* Department Breakdown Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Departmental Audit & Compliance Overview
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Audit activity and compliance issue status tracked per department.
            </p>
          </div>
          <Link
            to="/governance/audits"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            View Department Audits <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.department_stats || []).map(dept => (
            <div key={dept.department_id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-200">{dept.department_name}</span>
                {dept.overdue_issues_count > 0 ? (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-[10px] font-bold border border-red-500/30">
                    {dept.overdue_issues_count} Overdue Issue
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-[10px] font-bold">
                    Good Standing
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div>
                  <span className="block text-slate-500">Audits</span>
                  <span className="text-sm font-bold text-slate-200">{dept.audits_count}</span>
                </div>
                <div>
                  <span className="block text-slate-500">Issues</span>
                  <span className="text-sm font-bold text-slate-200">{dept.issues_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GovernanceDashboard
