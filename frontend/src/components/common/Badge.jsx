import React from 'react'

const Badge = ({ role, status, children }) => {
  const getStyle = () => {
    const val = role || status || children
    switch (val) {
      case 'Admin':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      case 'ESG Manager':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'Employee':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      case 'Active':
      case 'CSR Activity':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30'
      case 'Inactive':
        return 'bg-slate-700/50 text-slate-400 border-slate-600/30'
      case 'Challenge':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${getStyle()}`}>
      {children || role || status}
    </span>
  )
}

export default Badge
