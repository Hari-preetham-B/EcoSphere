import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { createClient } from '@supabase/supabase-js'
import {
  Target, Plus, Zap, Clock, CheckCircle2, X, Upload,
  Star, Users, Search, AlertCircle, ChevronDown
} from 'lucide-react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const DIFFICULTY_COLORS = {
  Easy: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  Medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  Hard: 'text-red-400 bg-red-500/15 border-red-500/30',
}

const STATUS_COLORS = {
  Draft: 'text-slate-400 bg-slate-800',
  Active: 'text-emerald-400 bg-emerald-500/15',
  'Under Review': 'text-amber-400 bg-amber-500/15',
  Completed: 'text-purple-400 bg-purple-500/15',
  Archived: 'text-slate-500 bg-slate-900',
}

const ChallengesPage = () => {
  const { token, role } = useAuth()
  const isManager = role === 'Admin' || role === 'ESG Manager'

  const [challenges, setChallenges] = useState([])
  const [categories, setCategories] = useState([])
  const [pendingParts, setPendingParts] = useState([])
  const [myParts, setMyParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active') // 'active', 'all', 'my', 'review'
  const [searchTerm, setSearchTerm] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({
    title: '', category_id: '', description: '',
    xp: 50, difficulty: 'Easy', evidence_required: true,
    deadline: '', status: 'Active'
  })
  const [creating, setCreating] = useState(false)

  // Proof submit modal
  const [submitPart, setSubmitPart] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofNotes, setProofNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [chData, catData, myData] = await Promise.all([
        api.get('/gamification/challenges', token),
        api.get('/categories?type=Challenge&status=Active', token),
        api.get('/gamification/challenges/participations/my', token),
      ])
      setChallenges(chData)
      setCategories(catData)
      setMyParts(myData)

      if (isManager) {
        const pending = await api.get('/gamification/challenges/participations?status=Submitted', token)
        setPendingParts(pending)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, isManager])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Upload proof to Supabase Storage
  const handleUploadAndSubmit = async () => {
    if (!submitPart) return
    setUploading(true)
    setUploadError('')
    try {
      let proof_url = ''
      if (proofFile) {
        const MAX_SIZE = 10 * 1024 * 1024
        if (proofFile.size > MAX_SIZE) throw new Error('File too large (max 10 MB)')
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
        if (!allowed.includes(proofFile.type)) throw new Error('Unsupported file type. Use JPG, PNG, WEBP, GIF, or PDF.')

        const ext = proofFile.name.split('.').pop()
        const path = `challenge-proofs/${submitPart.id}-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('proofs').upload(path, proofFile)
        if (uploadErr) throw new Error(uploadErr.message)

        const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path)
        proof_url = urlData.publicUrl
      }

      await api.put(`/gamification/challenges/participations/${submitPart.id}/submit`, token, {
        proof_url,
        notes: proofNotes
      })
      setSubmitPart(null)
      setProofFile(null)
      setProofNotes('')
      fetchAll()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleJoin = async (challengeId) => {
    try {
      await api.post(`/gamification/challenges/${challengeId}/join`, token)
      fetchAll()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleApprove = async (partId) => {
    try {
      await api.put(`/gamification/challenges/participations/${partId}/approve`, token)
      fetchAll()
    } catch (err) { alert(err.message) }
  }

  const handleReject = async (partId) => {
    const notes = prompt('Rejection reason (optional):')
    try {
      await api.put(`/gamification/challenges/participations/${partId}/reject`, token, { notes: notes || '' })
      fetchAll()
    } catch (err) { alert(err.message) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setCreating(true)
      await api.post('/gamification/challenges', token, {
        ...formData,
        xp: parseInt(formData.xp) || 50,
      })
      setShowCreate(false)
      setFormData({ title: '', category_id: '', description: '', xp: 50, difficulty: 'Easy', evidence_required: true, deadline: '', status: 'Active' })
      fetchAll()
    } catch (err) { alert(err.message) }
    finally { setCreating(false) }
  }

  const myPartMap = Object.fromEntries(myParts.map(p => [p.challenge_id, p]))

  const displayChallenges = challenges.filter(ch => {
    const matchSearch = ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ch.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchSearch) return false
    if (tab === 'active') return ch.status === 'Active'
    if (tab === 'my') return !!myPartMap[ch.id]
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">ESG Challenges</span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">Sustainability Challenges</h1>
          <p className="text-xs text-slate-400 mt-1">Join challenges, submit proof, and earn XP toward badges and rewards.</p>
        </div>
        {isManager && (
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/30 flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Create Challenge
          </button>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'active', label: 'Active' },
            { key: 'all', label: 'All Challenges' },
            { key: 'my', label: 'My Participation' },
            ...(isManager ? [{ key: 'review', label: `Pending Review (${pendingParts.length})` }] : []),
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tab === key ? 'bg-amber-600 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input type="text" placeholder="Search challenges..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      {/* Manager Pending Review Tab */}
      {tab === 'review' && isManager && (
        <div className="space-y-3">
          {pendingParts.length === 0 ? (
            <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No submissions waiting for review.</p>
            </div>
          ) : pendingParts.map(part => (
            <div key={part.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <p className="font-bold text-slate-100 text-sm">{part.challenge_title}</p>
                <p className="text-xs text-slate-400">Submitted by: <span className="text-slate-200 font-semibold">{part.user_name}</span> · {part.user_email}</p>
                {part.notes && <p className="text-xs text-slate-400 italic">"{part.notes}"</p>}
                {part.proof_url && (
                  <a href={part.proof_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 underline">
                    View Proof File ↗
                  </a>
                )}
                <p className="text-xs text-emerald-400 font-bold">+{part.challenge_xp} XP on approval</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleReject(part.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 text-red-400 text-xs font-semibold rounded-xl border border-slate-700 hover:border-red-500/30 transition-all">
                  Reject
                </button>
                <button onClick={() => handleApprove(part.id)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20">
                  ✓ Approve & Award XP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Challenges Grid */}
      {tab !== 'review' && (
        loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading challenges...</div>
        ) : displayChallenges.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <Target className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No Challenges Found</h3>
            <p className="text-xs text-slate-500">Try a different filter or create a new challenge.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayChallenges.map(ch => {
              const myPart = myPartMap[ch.id]
              return (
                <div key={ch.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${DIFFICULTY_COLORS[ch.difficulty] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                        {ch.difficulty}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[ch.status] || 'text-slate-400 bg-slate-800'}`}>
                        {ch.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base leading-snug">{ch.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{ch.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Zap className="w-3.5 h-3.5" /> {ch.xp} XP
                      </span>
                      {ch.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {ch.deadline}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {ch.participant_count}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    {!myPart && ch.status === 'Active' && (
                      <button onClick={() => handleJoin(ch.id)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all">
                        Join Challenge
                      </button>
                    )}
                    {myPart?.status === 'Joined' && (
                      <button onClick={() => setSubmitPart(myPart)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                        <Upload className="w-3.5 h-3.5" /> Submit Proof
                      </button>
                    )}
                    {myPart?.status === 'Submitted' && (
                      <span className="w-full py-2 bg-amber-500/15 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Under Review
                      </span>
                    )}
                    {myPart?.status === 'Approved' && (
                      <span className="w-full py-2 bg-emerald-500/15 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved · +{myPart.xp_awarded} XP
                      </span>
                    )}
                    {myPart?.status === 'Rejected' && (
                      <button onClick={() => setSubmitPart(myPart)}
                        className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition-all">
                        Resubmit Proof
                      </button>
                    )}
                    {myPart?.status === 'Joined' || (!myPart && ch.status !== 'Active') ? null : null}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Proof Submit Modal */}
      {submitPart && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" /> Submit Challenge Proof
              </h3>
              <button onClick={() => { setSubmitPart(null); setProofFile(null); setProofNotes(''); setUploadError('') }}
                className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <p className="text-xs text-slate-400">Challenge: <span className="text-slate-200 font-semibold">{submitPart.challenge_title}</span></p>

            {uploadError && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {uploadError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Proof File (Image or PDF, max 10 MB)</label>
                <input type="file" accept="image/*,.pdf"
                  onChange={e => setProofFile(e.target.files[0])}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-slate-950 hover:file:bg-amber-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Additional Notes</label>
                <textarea rows={3} value={proofNotes} onChange={e => setProofNotes(e.target.value)}
                  placeholder="Describe what you did..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button onClick={() => { setSubmitPart(null); setProofFile(null); setProofNotes(''); setUploadError('') }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">Cancel</button>
              <button onClick={handleUploadAndSubmit} disabled={uploading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-600/20">
                {uploading ? 'Uploading...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" /> Create ESG Challenge
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Challenge Title *</label>
                <input type="text" required value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Zero Plastic Month"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500">
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Difficulty</label>
                  <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500">
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">XP Reward</label>
                  <input type="number" min={10} max={1000} value={formData.xp}
                    onChange={e => setFormData({ ...formData, xp: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Deadline</label>
                  <input type="date" value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description & Instructions</label>
                <textarea rows={4} value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what employees should do and what counts as evidence..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <input type="checkbox" id="evidence_req" checked={formData.evidence_required}
                  onChange={e => setFormData({ ...formData, evidence_required: e.target.checked })}
                  className="rounded border-slate-600 text-amber-500" />
                <label htmlFor="evidence_req" className="text-slate-300 font-semibold cursor-pointer">
                  Require proof upload for submission
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-bold shadow-md shadow-amber-600/30">
                  {creating ? 'Creating...' : 'Launch Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChallengesPage
