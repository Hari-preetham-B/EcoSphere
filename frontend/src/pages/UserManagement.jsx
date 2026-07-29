import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import { UserCog, Search, RefreshCw, Shield, AlertCircle, CheckCircle2, Info } from 'lucide-react'

const UserManagement = () => {
  const { token, profile: currentAdminProfile, refreshProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Role Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [targetRole, setTargetRole] = useState('Employee')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchUsers()
  }, [token])

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user)
    setTargetRole(user.role)
    setModalError('')
    setIsModalOpen(true)
  }

  const handleUpdateRole = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setSubmitting(true)
    setModalError('')

    try {
      const res = await fetch(`${API_BASE}/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: targetRole })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')

      setIsModalOpen(false)
      fetchUsers()
      if (selectedUser.id === currentAdminProfile?.id) {
        refreshProfile()
      }
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter ? u.role === roleFilter : true
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCog className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-slate-100">User & Role Management</h1>
          </div>
          <p className="text-sm text-slate-400">
            Promote or demote user permissions across Admin, ESG Manager, and Employee roles.
          </p>
        </div>
      </div>

      {/* Bootstrapper Info Box */}
      <div className="glass-panel p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-xs text-purple-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Role Assignment Rule:</span> New registrations automatically default to the <span className="font-semibold text-blue-300">Employee</span> role. The first registered account on EcoSphere was automatically bootstrapped as <span className="font-semibold text-purple-300">Admin</span>. Only Admins can modify roles.
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin Only</option>
            <option value="ESG Manager">ESG Manager Only</option>
            <option value="Employee">Employee Only</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table / List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800">
          <UserCog className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No users found</h3>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                        {(u.full_name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <span>{u.full_name || 'No name set'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge role={u.role} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenRoleModal(u)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 hover:border-purple-500/40 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        Manage Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update User Role"
      >
        {modalError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        {selectedUser && (
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Target User:</div>
              <div className="font-bold text-slate-100 text-sm">{selectedUser.full_name || selectedUser.email}</div>
              <div className="text-xs text-slate-500 font-mono">{selectedUser.email}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                Select Role Permission
              </label>
              <div className="space-y-2">
                {[
                  { id: 'Employee', title: 'Employee', desc: 'Standard access to ESG metrics, challenges, and reporting.' },
                  { id: 'ESG Manager', title: 'ESG Manager', desc: 'Access to ESG tracking, metric entries, and compliance reports.' },
                  { id: 'Admin', title: 'Admin', desc: 'Full privileges including Master Data CRUD (Departments, Categories) and User Role updates.' },
                ].map((roleOption) => (
                  <label
                    key={roleOption.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      targetRole === roleOption.id
                        ? 'bg-purple-500/10 border-purple-500/50 text-slate-100'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleOption.id}
                      checked={targetRole === roleOption.id}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="mt-1 accent-purple-500"
                    />
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {roleOption.title}
                        {targetRole === roleOption.id && (
                          <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{roleOption.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Save Role Change'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default UserManagement
