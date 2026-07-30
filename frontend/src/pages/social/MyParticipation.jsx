import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { HeartHandshake, Upload, Award, FileText, CheckCircle2, AlertCircle, ExternalLink, Calendar } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB limit as requested by user
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

const MyParticipation = () => {
  const { token, profile } = useAuth()
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedPart, setSelectedPart] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const fetchMyParticipations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/csr-activities/participations/my', token)
      setParticipations(res)
    } catch (err) {
      setError(err.message || 'Failed to load participations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchMyParticipations()
  }, [token])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    setUploadError('')
    if (!selected) {
      setFile(null)
      return
    }

    // Client-side validation: file type & max 5MB size as requested by user
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setUploadError('Invalid file format. Only JPG, PNG, WEBP, GIF, and PDF files are allowed.')
      setFile(null)
      return
    }

    if (selected.size > MAX_FILE_SIZE) {
      setUploadError(`File is too large (${(selected.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5MB.`)
      setFile(null)
      return
    }

    setFile(selected)
  }

  const handleUploadProof = async (e) => {
    e.preventDefault()
    if (!selectedPart || !file) {
      setUploadError('Please select a valid file first.')
      return
    }

    try {
      setUploading(true)
      setUploadError('')

      // 1. Upload to Supabase Storage bucket 'csr-proofs'
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedPart.id}_${Date.now()}.${fileExt}`
      const filePath = `proofs/${fileName}`

      const { data, error: uploadErr } = await supabase.storage
        .from('csr-proofs')
        .upload(filePath, file, { upsert: true })

      let publicUrl = ''
      if (uploadErr) {
        // Fallback: If bucket is missing or unconfigured in Supabase, notify clearly
        console.warn('Supabase storage upload error:', uploadErr)
        setUploadError(`Supabase Storage upload failed: ${uploadErr.message}. Ensure bucket 'csr-proofs' exists.`)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('csr-proofs')
        .getPublicUrl(filePath)
      publicUrl = urlData.publicUrl

      // 2. Save public URL to backend database
      await api.put(`/csr-activities/participations/${selectedPart.id}/proof`, token, {
        proof_url: publicUrl,
      })

      setSuccess('Proof uploaded successfully! Pending manager review.')
      setSelectedPart(null)
      setFile(null)
      fetchMyParticipations()
    } catch (err) {
      setUploadError(err.message || 'Failed to upload proof')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
            <HeartHandshake className="w-4 h-4" /> My CSR & Social Activity
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">My Participations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your registered CSR activities, upload verification proof, and view your earned Points/XP.
          </p>
        </div>

        {/* Current Points Counter */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">Total Balance</div>
            <div className="text-xl font-extrabold text-slate-100">{profile?.points || 0} Points / XP</div>
          </div>
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

      {/* Participations List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading your participations...</div>
      ) : participations.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-semibold">No Participations Yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            Browse the "CSR Activities" tab to register for ongoing social events and earn Points.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Activity Title</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Proof File</th>
                  <th className="px-6 py-4 text-right">Points Earned</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {participations.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100">{p.activity_title}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {p.registered_at ? p.registered_at.split('T')[0] : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.status === 'Approved' ? 'success' : p.status === 'Rejected' ? 'danger' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {p.proof_url ? (
                        <a
                          href={p.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Proof <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">No proof attached</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-400">
                      {p.status === 'Approved' ? `+${p.points_awarded}` : '0'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPart(p)
                          setFile(null)
                          setUploadError('')
                        }}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold rounded-xl text-xs transition-all inline-flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> {p.proof_url ? 'Replace Proof' : 'Upload Proof'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Proof Modal */}
      {selectedPart && (
        <Modal isOpen={!!selectedPart} onClose={() => setSelectedPart(null)} title="Upload CSR Participation Proof">
          <form onSubmit={handleUploadProof} className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Uploading verification proof for: <strong className="text-slate-200">{selectedPart.activity_title}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Proof File (Images or PDF, Max 5MB) *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Allowed types: JPG, PNG, WEBP, GIF, PDF. Max file size: 5MB.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPart(null)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !file}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? 'Uploading...' : 'Submit Proof'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default MyParticipation
