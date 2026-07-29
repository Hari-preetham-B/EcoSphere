import React from 'react'
import {
  Leaf,
  Users,
  ShieldCheck,
  Trophy,
  FileText,
  Settings as SettingsIcon,
  Layers
} from 'lucide-react'

export const ModulePlaceholder = ({ title, icon: Icon, color, description, kpis = [] }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl ${color} shadow-lg shrink-0`}>
            <Icon className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              EcoSphere Core Module
            </span>
            <h1 className="text-3xl font-extrabold text-slate-100 mt-1">{title}</h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-300">Module Frame Active</span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl">
              <span className="text-xs font-bold uppercase text-slate-400">{kpi.label}</span>
              <div className="text-2xl font-extrabold text-slate-100 mt-2">{kpi.value}</div>
              <span className="text-xs text-emerald-400 mt-1 block font-medium">{kpi.change}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content Placeholder Box */}
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto border border-slate-800 text-slate-500">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">{title} Workspace</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          This section is configured in the shell layout and ready for operational data metrics, sub-module forms, and automated reporting.
        </p>
      </div>
    </div>
  )
}

export const EnvironmentalPage = () => (
  <ModulePlaceholder
    title="Environmental Sustainability (E)"
    icon={Leaf}
    color="bg-gradient-to-tr from-emerald-500 to-teal-400"
    description="Track Scope 1, 2 & 3 emissions, energy consumption audits, water recycling metrics, and net-zero transition goals."
    kpis={[
      { label: 'CO2 Emissions', value: '1,420 tCO2e', change: '-8.4% vs last quarter' },
      { label: 'Renewable Energy', value: '64.2%', change: '+12.5% solar adoption' },
      { label: 'Waste Recycled', value: '88.5%', change: 'Zero waste target: 2028' }
    ]}
  />
)

export const SocialPage = () => (
  <ModulePlaceholder
    title="Social Responsibility (S)"
    icon={Users}
    color="bg-gradient-to-tr from-teal-500 to-cyan-400"
    description="Manage CSR initiatives, community outreach programs, workplace diversity, employee safety metrics, and labor standards."
    kpis={[
      { label: 'CSR Community Hours', value: '3,850 hrs', change: '+24% volunteering' },
      { label: 'Diversity Index', value: '48.5%', change: 'Equal opportunity benchmark' },
      { label: 'Safety Incident Rate', value: '0.00', change: '100% zero-harm workplace' }
    ]}
  />
)

export const GovernancePage = () => (
  <ModulePlaceholder
    title="Corporate Governance (G)"
    icon={ShieldCheck}
    color="bg-gradient-to-tr from-purple-500 to-indigo-400"
    description="Ensure ethical compliance, anti-corruption policies, board composition transparency, data privacy compliance, and whistleblowing safeguards."
    kpis={[
      { label: 'Ethics Certification', value: '100%', change: 'All employees completed' },
      { label: 'Audit Compliance', value: 'Grade A', change: 'Passed external ESG audit' },
      { label: 'Data Privacy Score', value: '99.8%', change: 'GDPR / ISO 27001 verified' }
    ]}
  />
)

export const GamificationPage = () => (
  <ModulePlaceholder
    title="Gamification & Eco-Challenges"
    icon={Trophy}
    color="bg-gradient-to-tr from-amber-500 to-yellow-400"
    description="Engage employees with green challenges, departmental leaderboards, eco-badges, and rewards for sustainable workplace habits."
    kpis={[
      { label: 'Active Eco-Warriors', value: '342 Employees', change: '78% company participation' },
      { label: 'Challenges Completed', value: '1,280', change: 'Top: Paperless Month' },
      { label: 'Eco-Points Awarded', value: '45,200 pts', change: 'Redeemable for green rewards' }
    ]}
  />
)

export const ReportsPage = () => (
  <ModulePlaceholder
    title="ESG Reporting & Compliance"
    icon={FileText}
    color="bg-gradient-to-tr from-blue-500 to-cyan-400"
    description="Generate GRI, SASB, and TCFD compliant ESG disclosure reports for investors, regulators, and stakeholders."
    kpis={[
      { label: 'Published Reports', value: '12 Filings', change: 'Annual ESG Report 2025' },
      { label: 'Framework Standard', value: 'GRI & SASB', change: 'Fully compliant' }
    ]}
  />
)

export const SettingsPage = () => (
  <ModulePlaceholder
    title="Platform Settings"
    icon={SettingsIcon}
    color="bg-gradient-to-tr from-slate-600 to-slate-400"
    description="Configure system preferences, Supabase database integration settings, security rules, and organization profile."
    kpis={[
      { label: 'Backend API', value: 'Flask REST', change: 'Healthy (v1.0)' },
      { label: 'Database Provider', value: 'Supabase Postgres', change: 'Connected' }
    ]}
  />
)
