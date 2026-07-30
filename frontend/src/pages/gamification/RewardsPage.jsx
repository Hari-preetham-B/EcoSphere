import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Gift, Plus, X, AlertCircle, ShoppingCart, CheckCircle2, Package } from 'lucide-react'

const RewardsPage = () => {
  const { token, role } = useAuth()
  const isManager = role === 'Admin' || role === 'ESG Manager'

  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('catalog')
  const [redeeming, setRedeeming] = useState(null)
  const [redeemMsg, setRedeemMsg] = useState('')
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', points_required: 100, stock: 10, status: 'Active' })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [rData, rems, dash] = await Promise.all([
        api.get('/gamification/rewards', token),
        api.get('/gamification/rewards/redemptions', token),
        api.get('/gamification/dashboard', token),
      ])
      setRewards(rData)
      setRedemptions(rems)
      setUserPoints(dash.my_points ?? 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleRedeem = async (reward) => {
    if (!window.confirm(`Redeem "${reward.name}" for ${reward.points_required} points?`)) return
    setRedeeming(reward.id)
    setRedeemMsg('')
    setError('')
    try {
      const resp = await api.post(`/gamification/rewards/${reward.id}/redeem`, token)
      setRedeemMsg(resp.message)
      setUserPoints(resp.remaining_points)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setRedeeming(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/gamification/rewards', token, {
        ...form,
        points_required: parseInt(form.points_required),
        stock: parseInt(form.stock),
      })
      setShowCreate(false)
      setForm({ name: '', description: '', points_required: 100, stock: 10, status: 'Active' })
      load()
    } catch (err) { alert(err.message) }
    finally { setCreating(false) }
  }

  const stockColor = (stock) => {
    if (stock === 0) return 'text-red-400'
    if (stock <= 3) return 'text-amber-400'
    return 'text-emerald-400'
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">Gamification</span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">Rewards Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">Redeem your earned points for real-world sustainability rewards.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-bold text-sm">
            💰 {userPoints.toLocaleString()} Points Available
          </div>
          {isManager && (
            <button onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-purple-600/30">
              <Plus className="w-4 h-4" /> Add Reward
            </button>
          )}
        </div>
      </div>

      {redeemMsg && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {redeemMsg}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        {['catalog', 'redemptions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              tab === t ? 'bg-purple-600 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}>
            {t === 'catalog' ? '🎁 Catalog' : '📋 My Redemptions'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading rewards...</div>
      ) : tab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rewards.map(reward => (
            <div key={reward.id}
              className={`glass-card p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                reward.stock === 0 ? 'border-slate-800 opacity-60' :
                userPoints >= reward.points_required ? 'border-purple-500/30 shadow-md shadow-purple-500/10' : 'border-slate-800'
              }`}>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl">🎁</span>
                  <div className={`text-xs font-bold flex items-center gap-1 ${stockColor(reward.stock)}`}>
                    <Package className="w-3.5 h-3.5" /> {reward.stock === 0 ? 'Out of Stock' : `${reward.stock} left`}
                  </div>
                </div>
                <h3 className="font-bold text-slate-100 text-base leading-tight">{reward.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{reward.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-amber-400 font-bold text-lg">
                  {reward.points_required.toLocaleString()} <span className="text-xs font-normal text-slate-500">pts</span>
                </span>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!reward.can_redeem || redeeming === reward.id}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    reward.stock === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : !reward.can_redeem
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                  }`}>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {redeeming === reward.id ? 'Redeeming...' : reward.stock === 0 ? 'Unavailable' : !reward.can_redeem ? `Need ${reward.points_required - userPoints} more pts` : 'Redeem'}
                </button>
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="col-span-3 glass-panel p-12 rounded-3xl border border-slate-800 text-center">
              <Gift className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No rewards available yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {redemptions.map(r => (
            <div key={r.id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="font-bold text-slate-100">{r.reward_name}</p>
                  {isManager && <p className="text-slate-400">Employee: <span className="text-slate-200">{r.user_name}</span></p>}
                  <p className="text-slate-500">{r.redeemed_at?.split('T')[0]}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <p className="text-red-400 font-bold">−{r.points_spent} pts</p>
                  <p className={`font-semibold ${r.status === 'Fulfilled' ? 'text-emerald-400' : 'text-amber-400'}`}>{r.status}</p>
                </div>
              </div>
            </div>
          ))}
          {redemptions.length === 0 && (
            <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
              No redemptions yet. Visit the Catalog and spend your points!
            </div>
          )}
        </div>
      )}

      {/* Create Reward Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-400" /> Add Reward
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Points Required</label>
                  <input type="number" min={1} value={form.points_required} onChange={e => setForm({ ...form, points_required: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Stock</label>
                  <input type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold">
                  {creating ? 'Adding...' : 'Add Reward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RewardsPage
