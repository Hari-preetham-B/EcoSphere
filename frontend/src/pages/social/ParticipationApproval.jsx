import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Badge from '../../components/common/Badge'
import { ShieldCheck, Check, X, FileText, ExternalLink, AlertCircle, CheckCircle2, Award } from 'lucide-react'

const ParticipationApproval = () => {
  const { token, role } = useAuth()
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('Pending')

  const fetchParticipations = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/csr-activities/participations${filterStatus ? `?status=${filterStatus}` : ''}`, token)
      setParticipations(res)
    } catch (err) {
      setError(err.message || 'Failed to load participations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchParticipations()
  }, [token, filterStatus])

  const handleApprove = async (id) => {
    try {
      setError('')
      setSuccess('')
      await api.put(`/csr-activities/participations/${id}/approve`, token, {})
      setSuccess('Participation approved and Points/XP awarded to employee!')
      fetchParticipations()
    } catch (err) {
      setError(err.message || 'Failed to approve participation')
    }
  }

  const handleReject = async (id) => {
    try {
      setError('')
      setSuccess('')
      await api.put(`/csr-activities/participations/${id}/reject`, token, { notes: 'Rejected by Manager' })
      setSuccess('Participation rejected.')
      fetchParticipations()
    } catch (err) {
      setError(err.message || 'Failed to reject participation')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" /> Manager Approval Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">CSR Approvals</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review submitted proof files, approve employee CSR participations, and award Points/XP.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shrink-0">
          {['Pending', 'Approved', 'Rejected', ''].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading participations...</div>
      ) : participations.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-semibold">No {filterStatus || 'CSR'} Participations Found</h3>
          <p className="text-slate-500 text-sm mt-1">
            {filterStatus === 'Pending' ? 'No pending employee CSR submissions requiring approval.' : 'No records match your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Activity Title</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4">Verification Proof</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {participations.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100">{p.user_name}</div>
                      <div className="text-xs text-slate-400">{p.user_email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">{p.activity_title}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {p.registered_at ? p.registered_at.split('T')[0] : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {p.proof_url ? (
                        <a
                          href={p.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Uploaded Proof <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-amber-400/90 italic font-medium">No proof uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.status === 'Approved' ? 'success' : p.status === 'Rejected' ? 'danger' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-semibold rounded-xl text-xs transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve (+Points)
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-semibold rounded-xl text-xs transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                      {p.status === 'Approved' && (
                        <span className="text-xs text-emerald-400 font-medium flex items-center justify-end gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-400" /> +{p.points_awarded} Points
                        </span>
                      )}
                      {p.status === 'Rejected' && (
                        <span className="text-xs text-rose-400/80 font-medium">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParticipationApproval
