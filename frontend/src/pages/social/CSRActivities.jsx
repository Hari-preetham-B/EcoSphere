import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { HeartHandshake, Plus, Calendar, Building2, Tag, Award, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react'

const CSRActivities = () => {
  const { token, role } = useAuth()
  const [activities, setActivities] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [myParticipations, setMyParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    department_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    points_reward: 50,
  })

  const canManage = role === 'Admin' || role === 'ESG Manager'

  const fetchData = async () => {
    try {
      setLoading(true)
      const [actRes, catRes, deptRes, myRes] = await Promise.all([
        api.get('/csr-activities', token),
        api.get('/categories', token),
        api.get('/departments', token),
        api.get('/csr-activities/participations/my', token),
      ])
      setActivities(actRes)
      setCategories(catRes)
      setDepartments(deptRes)
      setMyParticipations(myRes)
    } catch (err) {
      setError(err.message || 'Failed to load CSR activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setError('')
      await api.post('/csr-activities', token, {
        title: formData.title,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        description: formData.description,
        date: formData.date,
        points_reward: parseInt(formData.points_reward) || 50,
      })
      setSuccess('CSR Activity created successfully!')
      setIsModalOpen(false)
      setFormData({
        title: '',
        category_id: '',
        department_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        points_reward: 50,
      })
      fetchData()
    } catch (err) {
      setError(err.message || 'Failed to create activity')
    }
  }

  const handleRegister = async (activityId) => {
    try {
      setError('')
      setSuccess('')
      await api.post(`/csr-activities/${activityId}/register`, token, {})
      setSuccess('Registered for activity! Upload proof under "My Participations" to complete.')
      fetchData()
    } catch (err) {
      setError(err.message || 'Failed to register')
    }
  }

  const isRegistered = (activityId) => {
    return myParticipations.some(p => p.activity_id === activityId)
  }

  const getParticipationStatus = (activityId) => {
    const p = myParticipations.find(p => p.activity_id === activityId)
    return p ? p.status : null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
            <HeartHandshake className="w-4 h-4" /> Social ESG Module
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">CSR Activities</h1>
          <p className="text-slate-400 text-sm mt-1">
            Organise, participate, and earn Points/XP for community and corporate social responsibility events.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Activity
          </button>
        )}
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

      {/* Activity Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading CSR Activities...</div>
      ) : activities.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-semibold">No CSR Activities Yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            {canManage ? 'Click "Create Activity" above to schedule your organisation’s first CSR event.' : 'No active CSR activities available right now.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((act) => {
            const registered = isRegistered(act.id)
            const pStatus = getParticipationStatus(act.id)
            return (
              <div
                key={act.id}
                className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-slate-100 text-base leading-snug">{act.title}</h3>
                    <Badge variant={act.status === 'Active' ? 'success' : 'neutral'}>
                      {act.status}
                    </Badge>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-3 mb-4">{act.description || 'No description provided.'}</p>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{act.date}</span>
                    </div>
                    {act.department_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>{act.department_name}</span>
                      </div>
                    )}
                    {act.category_name && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-purple-400" />
                        <span>{act.category_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1 font-semibold text-amber-400">
                      <Award className="w-3.5 h-3.5" />
                      <span>+{act.points_reward} Points / XP</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60">
                  {registered ? (
                    <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-800/80 rounded-xl">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Registered
                      </span>
                      <Badge variant={pStatus === 'Approved' ? 'success' : pStatus === 'Rejected' ? 'danger' : 'warning'}>
                        {pStatus}
                      </Badge>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(act.id)}
                      disabled={act.status !== 'Active'}
                      className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Register for Activity
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Activity Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create CSR Activity">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Annual Beach Clean-up Drive"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Points Reward</label>
              <input
                type="number"
                min="0"
                value={formData.points_reward}
                onChange={(e) => setFormData({ ...formData, points_reward: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Optional --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Company-wide --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe event scope, venue, requirements..."
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
              Save Activity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CSRActivities
