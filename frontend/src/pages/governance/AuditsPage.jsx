import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  ClipboardList,
  Plus,
  Building2,
  Calendar,
  UserCheck,
  FileText,
  AlertTriangle,
  Search,
  X,
  CheckCircle2
} from 'lucide-react'

const AuditsPage = () => {
  const { role } = useAuth()
  const isManager = role === 'Admin' || role === 'ESG Manager'

  const [audits, setAudits] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('')

  // Create audit modal
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    department_id: '',
    auditor_name: '',
    audit_date: new Date().toISOString().split('T')[0],
    scope: '',
    findings_summary: '',
    status: 'Completed'
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchAudits = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = '/api/governance/audits?'
      if (selectedDept) url += `department_id=${selectedDept}&`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const data = await res.json()
      setAudits(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDepartments(data)
        if (data.length > 0 && !formData.department_id) {
          setFormData(prev => ({ ...prev, department_id: data[0].id }))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchAudits()
    fetchDepartments()
  }, [selectedDept])

  const handleCreateAudit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.auditor_name || !formData.department_id) return
    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/governance/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to log audit')
      }
      setShowModal(false)
      setFormData({
        title: '',
        department_id: departments[0]?.id || '',
        auditor_name: '',
        audit_date: new Date().toISOString().split('T')[0],
        scope: '',
        findings_summary: '',
        status: 'Completed'
      })
      fetchAudits()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAudits = audits.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.auditor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.department_name && a.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
            Compliance Verification
          </span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">Departmental ESG Audits</h1>
          <p className="text-xs text-slate-400 mt-1">
            Log, track, and archive environmental and governance audits conducted per department.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Log New Audit
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audits..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Audits List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading audit records...</div>
      ) : filteredAudits.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Audits Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No departmental audit logs exist matching your query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAudits.map(audit => (
            <div key={audit.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded text-[10px] font-bold uppercase">
                      Audit #{audit.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      audit.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {audit.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">{audit.title}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Building2 className="w-4 h-4 text-slate-500" /> {audit.department_name}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-4 h-4 text-slate-500" /> {audit.audit_date}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-semibold block flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Auditor / Assurance Body
                  </span>
                  <span className="text-slate-200 font-semibold text-sm">{audit.auditor_name}</span>
                </div>

                <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-semibold block flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Linked Compliance Issues
                  </span>
                  <span className="text-slate-200 font-semibold text-sm">
                    {audit.issues_count} Issue{audit.issues_count === 1 ? '' : 's'}
                    {audit.overdue_issues_count > 0 && (
                      <span className="text-red-400 ml-2 text-xs">({audit.overdue_issues_count} Overdue!)</span>
                    )}
                  </span>
                </div>
              </div>

              {audit.scope && (
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500 font-semibold block">Audit Scope:</span>
                  <p className="mt-0.5 text-slate-400">{audit.scope}</p>
                </div>
              )}

              {audit.findings_summary && (
                <div className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-indigo-400 font-bold block mb-1">Findings Summary:</span>
                  <p className="text-slate-300 leading-relaxed">{audit.findings_summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE AUDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-400" /> Log Departmental Audit
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Audit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Environmental Safety & Emissions Audit"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Department *</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Auditor Name / Agency *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bureau Veritas"
                    value={formData.auditor_name}
                    onChange={e => setFormData({ ...formData, auditor_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Audit Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.audit_date}
                    onChange={e => setFormData({ ...formData, audit_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Audit Scope</label>
                <input
                  type="text"
                  placeholder="e.g. Scope 1 & 2 emissions data, waste handling, chemical storage"
                  value={formData.scope}
                  onChange={e => setFormData({ ...formData, scope: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Findings Summary</label>
                <textarea
                  rows={3}
                  placeholder="Summarize key compliance observations, non-conformances, or recommendations..."
                  value={formData.findings_summary}
                  onChange={e => setFormData({ ...formData, findings_summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/30"
                >
                  {submitting ? 'Saving...' : 'Save Audit Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditsPage
