import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  AlertTriangle,
  Plus,
  Clock,
  UserCheck,
  Building2,
  CheckCircle2,
  Filter,
  Search,
  X,
  FileText,
  AlertCircle
} from 'lucide-react'

const ComplianceIssuesPage = () => {
  const { role } = useAuth()
  const isManager = role === 'Admin' || role === 'ESG Manager'
  const location = useLocation()

  const [issues, setIssues] = useState([])
  const [audits, setAudits] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [activeTab, setActiveTab] = useState('all') // 'all', 'overdue', 'high_critical', 'open', 'resolved'
  const [searchTerm, setSearchTerm] = useState('')

  // Modal for new issue
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    audit_id: '',
    severity: 'High',
    description: '',
    owner_id: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'Open',
    resolution_notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Modal for updating status / resolving issue
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [updateStatus, setUpdateStatus] = useState('Resolved')
  const [resolutionNotes, setResolutionNotes] = useState('')

  useEffect(() => {
    // Read search params
    const queryParams = new URLSearchParams(location.search)
    if (queryParams.get('overdue_only') === 'true') {
      setActiveTab('overdue')
    }
  }, [location.search])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = '/api/governance/issues?'
      if (activeTab === 'overdue') url += 'overdue_only=true&'
      if (activeTab === 'open') url += 'status=Open&'
      if (activeTab === 'resolved') url += 'status=Resolved&'

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch compliance issues')
      const data = await res.json()
      setIssues(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token')
      const [auditsRes, usersRes] = await Promise.all([
        fetch('/api/governance/audits', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (auditsRes.ok) {
        const aData = await auditsRes.json()
        setAudits(aData)
        if (aData.length > 0 && !formData.audit_id) {
          setFormData(prev => ({ ...prev, audit_id: aData[0].id }))
        }
      }

      if (usersRes.ok) {
        const uData = await usersRes.json()
        setUsers(uData)
        if (uData.length > 0 && !formData.owner_id) {
          setFormData(prev => ({ ...prev, owner_id: uData[0].id }))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [activeTab])

  useEffect(() => {
    fetchMetadata()
  }, [])

  const handleCreateIssue = async (e) => {
    e.preventDefault()
    if (!formData.audit_id || !formData.owner_id || !formData.due_date || !formData.description) return
    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/governance/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to log compliance issue')
      }
      setShowCreateModal(false)
      setFormData({
        audit_id: audits[0]?.id || '',
        severity: 'High',
        description: '',
        owner_id: users[0]?.id || '',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'Open',
        resolution_notes: ''
      })
      fetchIssues()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateIssueStatus = async (e) => {
    e.preventDefault()
    if (!selectedIssue) return
    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/governance/issues/${selectedIssue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updateStatus,
          resolution_notes: resolutionNotes
        })
      })
      if (!res.ok) throw new Error('Failed to update issue status')
      setSelectedIssue(null)
      fetchIssues()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openUpdateModal = (issue) => {
    setSelectedIssue(issue)
    setUpdateStatus(issue.status === 'Open' ? 'In Progress' : 'Resolved')
    setResolutionNotes(issue.resolution_notes || '')
  }

  const filteredIssues = issues.filter(issue => {
    const matchesSearch =
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.audit_title && issue.audit_title.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (activeTab === 'high_critical') {
      return issue.severity === 'High' || issue.severity === 'Critical'
    }
    return true
  })

  const overdueCount = issues.filter(i => i.is_overdue).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            Audit Corrective Actions
          </span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">Compliance Issues & Remediation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track audit non-conformances, assign mandatory owners, enforce due dates, and flag overdue open items.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Log Compliance Issue
          </button>
        )}
      </div>

      {/* OVERDUE ALERT BANNER */}
      {overdueCount > 0 && activeTab !== 'overdue' && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-red-300 font-medium">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
            <span>
              There {overdueCount === 1 ? 'is' : 'are'} <strong className="text-red-200">{overdueCount} overdue open compliance {overdueCount === 1 ? 'issue' : 'issues'}</strong> requiring immediate attention.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('overdue')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all shrink-0"
          >
            Filter Overdue Issues
          </button>
        </div>
      )}

      {/* Filters & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Issues
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'overdue'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-950 text-red-400 hover:bg-red-950/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue Only ({overdueCount})
          </button>
          <button
            onClick={() => setActiveTab('high_critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'high_critical'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            High / Critical Severity
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'open'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'resolved'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search issues or owner..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading compliance issues...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Compliance Issues Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No items match your active tab and search filter.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Description & Audit</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Owner (FK Source of Truth)</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredIssues.map(issue => (
                  <tr
                    key={issue.id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      issue.is_overdue ? 'bg-red-950/15' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        issue.severity === 'Critical' ? 'bg-red-600/30 text-red-300 border border-red-500/40' :
                        issue.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                        issue.severity === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {issue.severity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100">{issue.description}</div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                        Audit: {issue.audit_title}
                      </span>
                      {issue.resolution_notes && (
                        <p className="text-[11px] text-emerald-400 mt-1 italic">
                          Notes: {issue.resolution_notes}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {issue.department_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-200 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                        {issue.owner_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      {issue.is_overdue ? (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                          {issue.due_date} (OVERDUE)
                        </span>
                      ) : (
                        <span className="text-slate-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {issue.due_date}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        issue.status === 'Resolved' || issue.status === 'Closed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : issue.is_overdue
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}>
                        {issue.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openUpdateModal(issue)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE COMPLIANCE ISSUE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-purple-400" /> Log Compliance Non-Conformance
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Linked Audit *</label>
                <select
                  required
                  value={formData.audit_id}
                  onChange={e => setFormData({ ...formData, audit_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Audit Log</option>
                  {audits.map(a => (
                    <option key={a.id} value={a.id}>
                      #{a.id} - {a.title} ({a.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Severity *</label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assigned Owner (FK) *</label>
                  <select
                    required
                    value={formData.owner_id}
                    onChange={e => setFormData({ ...formData, owner_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select User Owner</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Remediation Due Date *</label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the non-conformance finding and required corrective action..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md shadow-purple-600/30"
                >
                  {submitting ? 'Creating...' : 'Log Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS / RESOLVE MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">
                Update Issue #{selectedIssue.id} Status
              </h3>
              <button onClick={() => setSelectedIssue(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateIssueStatus} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 block">{selectedIssue.description}</span>
                <span className="text-[11px] text-slate-500">
                  Owner: {selectedIssue.owner_name} • Due Date: {selectedIssue.due_date}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Status</label>
                <select
                  value={updateStatus}
                  onChange={e => setUpdateStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe corrective actions taken or verification evidence..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md shadow-purple-600/30"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplianceIssuesPage
