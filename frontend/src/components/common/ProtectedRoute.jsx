import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldAlert } from 'lucide-react'

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400">Authenticating EcoSphere Session...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900/80 border border-amber-500/30 rounded-2xl text-center backdrop-blur-md shadow-2xl">
        <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 text-amber-400 rounded-full mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Access Restricted</h2>
        <p className="text-slate-400 mb-4">
          Your account role (<span className="text-amber-400 font-semibold">{role}</span>) does not have permission to access this area.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Required roles: {allowedRoles.join(', ')}
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all border border-slate-700 hover:border-slate-600"
        >
          Return to Overview
        </a>
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
