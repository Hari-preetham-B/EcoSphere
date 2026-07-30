import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { GraduationCap, Plus, CheckCircle2, AlertCircle, Calendar, User, ExternalLink, ShieldAlert } from 'lucide-react'

const TrainingTracking = () => {
  const { token, role, user } = useAuth()
  const [trainings, setTrainings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    training_name: '',
    completion_date: '',
    status: 'Enrolled',
    cert_url: '',
  })

  const isManager = role === 'Admin' || role === 'ESG Manager'

  const fetchData = async () => {
    try {
      setLoading(true)
      const requests = [api.get('/trainings', token)]
      if (isManager) {
        requests.push(api.get('/users', token))
      }
      const [tRes, uRes] = await Promise.all(requests)
      setTrainings(tRes)
      if (uRes) setUsers(uRes)
    } catch (err) {
      setError(err.message || 'Failed to load training records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchData()
  }, [token, role])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      await api.post('/trainings', token, {
        user_id: isManager && formData.user_id ? formData.user_id : undefined,
        training_name: formData.training_name,
        completion_date: formData.completion_date || null,
        status: isManager ? formData.status : 'Enrolled', // Rule: Employee can only self-enroll as Enrolled
        cert_url: formData.cert_url,
      })
      setSuccess('Training record created successfully!')
      setIsModalOpen(false)
      setFormData({
        user_id: '',
        training_name: '',
        completion_date: '',
        status: 'Enrolled',
        cert_url: '',
      })
      fetchData()
    } catch (err) {
      setError(err.message || 'Failed to create training record')
    }
  }

  const handleStatusChange = async (recId, newStatus) => {
    try {
      setError('')
      setSuccess('')
      await api.put(`/trainings/${recId}`, token, { status: newStatus })
      setSuccess(`Training status updated to ${newStatus}`)
      fetchData()
    } catch (err) {
      setError(err.message || 'Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
            <GraduationCap className="w-4 h-4" /> Social ESG Module
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Training Completion Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track ESG, safety, and compliance course enrollments and verified completion certificates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> {isManager ? 'Record Training' : 'Self Enroll Course'}
        </button>
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

      {/* Rules Notice for Employees */}
      {!isManager && (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Note:</strong> Employees can self-enroll in new courses. Marking a course status as <strong>'Completed'</strong> or <strong>'Failed'</strong> requires Manager/Admin verification.
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading training records...</div>
      ) : trainings.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-semibold">No Training Records Found</h3>
          <p className="text-slate-500 text-sm mt-1">
            Click "{isManager ? 'Record Training' : 'Self Enroll Course'}" above to add your first training entry.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Training Name</th>
                  <th className="px-6 py-4">Completion Date</th>
                  <th className="px-6 py-4">Certificate</th>
                  <th className="px-6 py-4">Status</th>
                  {isManager && <th className="px-6 py-4 text-right">Manager Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trainings.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100">{t.user_name}</div>
                      <div className="text-xs text-slate-400">{t.user_email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">{t.training_name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {t.completion_date || <span className="italic text-slate-600">Pending</span>}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {t.cert_url ? (
                        <a
                          href={t.cert_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                        >
                          Certificate <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 italic">None attached</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={t.status === 'Completed' ? 'success' : t.status === 'Failed' ? 'danger' : 'info'}>
                        {t.status}
                      </Badge>
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 text-right">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Enrolled">Enrolled</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isManager ? 'Record Employee Training' : 'Self Enroll Course'}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {isManager && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Employee *</label>
              <select
                required
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Employee --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Training Course Name *</label>
            <input
              type="text"
              required
              value={formData.training_name}
              onChange={(e) => setFormData({ ...formData, training_name: e.target.value })}
              placeholder="e.g. ISO 14001 Environmental Management Systems"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Completion Date</label>
              <input
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {isManager && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Enrolled">Enrolled</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Certificate URL (Optional)</label>
            <input
              type="url"
              value={formData.cert_url}
              onChange={(e) => setFormData({ ...formData, cert_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
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
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default TrainingTracking
