import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import { Tags, Plus, Edit2, Trash2, Search, Filter, RefreshCw, AlertCircle, Calendar } from 'lucide-react'

const Categories = () => {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'CSR Activity',
    status: 'Active'
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  const fetchCategories = async () => {
    setLoading(true)
    setError('')
    try {
      let url = `${API_BASE}/categories?`
      if (typeFilter) url += `type=${encodeURIComponent(typeFilter)}&`
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load categories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchCategories()
  }, [token, typeFilter, statusFilter])

  const handleOpenCreateModal = () => {
    setEditingCat(null)
    setFormData({
      name: '',
      type: 'CSR Activity',
      status: 'Active'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (cat) => {
    setEditingCat(cat)
    setFormData({
      name: cat.name,
      type: cat.type,
      status: cat.status || 'Active'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const url = editingCat
        ? `${API_BASE}/categories/${editingCat.id}`
        : `${API_BASE}/categories`
      const method = editingCat ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save category')

      setIsModalOpen(false)
      fetchCategories()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return

    try {
      const res = await fetch(`${API_BASE}/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete category')
      fetchCategories()
    } catch (err) {
      alert(err.message)
    }
  }

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tags className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Category Master Data</h1>
          </div>
          <p className="text-sm text-slate-400">
            Manage categories for CSR Activities and Gamification Challenges across EcoSphere.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search category name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="CSR Activity">CSR Activity</option>
              <option value="Challenge">Challenge</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          <button
            onClick={fetchCategories}
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

      {/* Grid / Card view */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800">
          <Tags className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No categories found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Create categories to classify environmental and social CSR initiatives or gamified challenges.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge role={cat.type} />
                  <Badge status={cat.status} />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-1">{cat.name}</h3>

                <div className="text-xs text-slate-500 flex items-center gap-1 mt-4 pt-3 border-t border-slate-800/80">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created: {new Date(cat.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80 mt-4">
                <button
                  onClick={() => handleOpenEditModal(cat)}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  title="Edit Category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Create New Category'}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tree Plantation Drive / Renewable Energy Audit"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Category Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="CSR Activity">CSR Activity</option>
                <option value="Challenge">Challenge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Categories
