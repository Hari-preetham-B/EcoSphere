import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  FileCheck,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Users,
  Search,
  Filter,
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react'

const PoliciesPage = () => {
  const { role } = useAuth()
  const isManager = role === 'Admin' || role === 'ESG Manager'

  const [policies, setPolicies] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Active')

  // Create policy modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Ethics & Compliance',
    version: '1.0',
    status: 'Active',
    department_id: '',
    effective_date: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)

  // Acknowledgement tracking drawer/modal
  const [activeAckPolicy, setActiveAckPolicy] = useState(null)
  const [ackDetails, setAckDetails] = useState(null)
  const [ackLoading, setAckLoading] = useState(false)
  const [remindMessage, setRemindMessage] = useState('')

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = '/api/governance/policies?'
      if (selectedDept) url += `department_id=${selectedDept}&`
      if (selectedStatus) url += `status=${selectedStatus}&`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch ESG policies')
      const data = await res.json()
      setPolicies(data)
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
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchPolicies()
    fetchDepartments()
  }, [selectedDept, selectedStatus])

  const handleAcknowledge = async (policyId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/governance/policies/${policyId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to acknowledge policy')
      fetchPolicies()
    } catch (err) {
      alert(err.message)
    }
  }

  const openAckModal = async (policy) => {
    setActiveAckPolicy(policy)
    setAckLoading(true)
    setRemindMessage('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/governance/policies/${policy.id}/acknowledgements`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch policy acknowledgement records')
      const data = await res.json()
      setAckDetails(data)
    } catch (err) {
      console.error(err)
    } finally {
      setAckLoading(false)
    }
  }

  const handleSendReminderStub = async () => {
    if (!activeAckPolicy) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/governance/policies/${activeAckPolicy.id}/remind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to trigger policy reminder stub')
      const json = await res.json()
      setRemindMessage(json.message)
      // Refresh ack list
      openAckModal(activeAckPolicy)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreatePolicy = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/governance/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to create ESG Policy')
      }
      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        category: 'Ethics & Compliance',
        version: '1.0',
        status: 'Active',
        department_id: '',
        effective_date: new Date().toISOString().split('T')[0]
      })
      fetchPolicies()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPolicies = policies.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            Governance Framework
          </span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">ESG Policies & Directives</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, version, and assign ESG policies to departments. Monitor employee acknowledgements and trigger reminder notifications.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create ESG Policy
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="Active">Active Policies</option>
            <option value="Draft">Drafts</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading ESG Policies...</div>
      ) : filteredPolicies.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Policies Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No ESG policies match your selected filters. Create a new policy to establish compliance guidelines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPolicies.map(pol => (
            <div key={pol.id} className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-purple-500/15 text-purple-300 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
                    {pol.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono font-semibold">
                      v{pol.version}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pol.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {pol.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">{pol.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {pol.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {pol.department_name}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Effective: {pol.effective_date}
                  </span>
                </div>
              </div>

              {/* Acknowledgement Status Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-slate-200">{pol.ack_count || 0}</span> / {pol.total_users || 0} Acknowledged
                </div>

                <div className="flex items-center gap-2">
                  {isManager && (
                    <button
                      onClick={() => openAckModal(pol)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-400" /> Track & Remind
                    </button>
                  )}

                  {pol.user_acknowledged ? (
                    <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(pol.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE POLICY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-400" /> Create ESG Policy
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Policy Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Code of Ethics & Business Conduct"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Data Privacy / Environmental"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Version</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assigned Department</label>
                  <select
                    value={formData.department_id}
                    onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Departments (Company-wide)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={formData.effective_date}
                    onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Policy Description & Directives</label>
                <textarea
                  rows={4}
                  placeholder="Outline policy scope, guidelines, and compliance expectations..."
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
                  {submitting ? 'Creating...' : 'Publish ESG Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACKNOWLEDGEMENT TRACKING DRAWER/MODAL WITH STUB REMINDER BUTTON */}
      {activeAckPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-2xl w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" /> Policy Acknowledgements
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeAckPolicy.title} (v{activeAckPolicy.version})</p>
              </div>
              <button onClick={() => setActiveAckPolicy(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {remindMessage && (
              <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{remindMessage}</span>
              </div>
            )}

            {ackLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading records...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-4">
                    <span>Total Employees: <strong className="text-slate-200">{ackDetails?.total_employees || 0}</strong></span>
                    <span>Acknowledged: <strong className="text-emerald-400">{ackDetails?.acknowledged_count || 0}</strong></span>
                    <span>Pending: <strong className="text-amber-400">{ackDetails?.pending_count || 0}</strong></span>
                  </div>

                  {/* STUB REMINDER BUTTON */}
                  <button
                    onClick={handleSendReminderStub}
                    disabled={(ackDetails?.pending_count || 0) === 0}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Reminders (Stub)
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {(ackDetails?.acknowledgements || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{item.user_name}</span>
                        <span className="text-[11px] text-slate-500">{item.user_email} • {item.role}</span>
                      </div>
                      <div className="text-right">
                        {item.status === 'Acknowledged' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 font-bold rounded text-[10px]">
                            Acknowledged {item.acknowledged_at ? `(${item.acknowledged_at.split('T')[0]})` : ''}
                          </span>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 font-bold rounded text-[10px]">
                              Pending
                            </span>
                            {item.reminder_sent_at && (
                              <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                                Last Reminded: {item.reminder_sent_at.split('T')[0]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PoliciesPage
