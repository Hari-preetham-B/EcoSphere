import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import { Building2, Plus, Edit2, Trash2, Search, Filter, RefreshCw, AlertCircle, Users } from 'lucide-react'

const Departments = () => {
  const { token } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    head: '',
    parent_department_id: '',
    employee_count: 0,
    status: 'Active'
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchDepartments = async () => {
    setLoading(true)
    setError('')
    try {
      let path = '/departments'
      if (statusFilter) path += `?status=${statusFilter}`
      const data = await api.get(path, token)
      setDepartments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchDepartments()
  }, [token, statusFilter])

  const handleOpenCreateModal = () => {
    setEditingDept(null)
    setFormData({
      name: '',
      code: '',
      head: '',
      parent_department_id: '',
      employee_count: 0,
      status: 'Active'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      code: dept.code,
      head: dept.head || '',
      parent_department_id: dept.parent_department_id || '',
      employee_count: dept.employee_count || 0,
      status: dept.status || 'Active'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        parent_department_id: formData.parent_department_id ? parseInt(formData.parent_department_id) : null,
        employee_count: parseInt(formData.employee_count || 0)
      }

      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, token, payload)
      } else {
        await api.post('/departments', token, payload)
      }

      setIsModalOpen(false)
      fetchDepartments()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete department "${dept.name}"?`)) return

    try {
      await api.delete(`/departments/${dept.id}`, token)
      fetchDepartments()
    } catch (err) {
      alert(err.message)
    }
  }

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.head && d.head.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Department Management</h1>
          </div>
          <p className="text-sm text-slate-400">
            Define organizational structure, department heads, and headcount tracking.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code, or head..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          <button
            onClick={fetchDepartments}
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

      {/* Grid / Table View */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No departments found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Get started by creating your organization's first department.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Create Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {dept.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-1.5">{dept.name}</h3>
                  </div>
                  <Badge status={dept.status} />
                </div>

                <div className="space-y-2 text-xs text-slate-400 my-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department Head:</span>
                    <span className="font-semibold text-slate-300">{dept.head || 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Parent Department:</span>
                    <span className="font-semibold text-slate-300">
                      {dept.parent_department_name || 'Top-level'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Employees:
                    </span>
                    <span className="font-bold text-emerald-400">{dept.employee_count}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenEditModal(dept)}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  title="Edit Department"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dept)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Department"
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
        title={editingDept ? 'Edit Department' : 'Create New Department'}
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
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Environmental Strategy & Sustainability"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. ENV-01"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Employee Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.employee_count}
                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Department Head
            </label>
            <input
              type="text"
              value={formData.head}
              onChange={(e) => setFormData({ ...formData, head: e.target.value })}
              placeholder="e.g. Dr. Sarah Jenkins"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Parent Department
              </label>
              <select
                value={formData.parent_department_id}
                onChange={(e) => setFormData({ ...formData, parent_department_id: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">None (Top-Level)</option>
                {departments
                  .filter(d => !editingDept || d.id !== editingDept.id)
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
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
              {submitting ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Departments
