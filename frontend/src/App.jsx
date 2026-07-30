import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Departments from './pages/Departments'
import Categories from './pages/Categories'
import UserManagement from './pages/UserManagement'
import Settings from './pages/Settings'

import EnvironmentalDashboard from './pages/environmental/EnvironmentalDashboard'
import EmissionFactors from './pages/environmental/EmissionFactors'
import CarbonTransactions from './pages/environmental/CarbonTransactions'
import SustainabilityGoals from './pages/environmental/SustainabilityGoals'
import DepartmentTracking from './pages/environmental/DepartmentTracking'

import SocialCSRActivities from './pages/social/CSRActivities'
import SocialMyParticipation from './pages/social/MyParticipation'
import SocialApprovals from './pages/social/ParticipationApproval'
import SocialDiversity from './pages/social/DiversityMetrics'
import SocialTraining from './pages/social/TrainingTracking'

import GovernanceDashboard from './pages/governance/GovernanceDashboard'
import PoliciesPage from './pages/governance/PoliciesPage'
import AuditsPage from './pages/governance/AuditsPage'
import ComplianceIssuesPage from './pages/governance/ComplianceIssuesPage'

import GamificationDashboard from './pages/gamification/GamificationDashboard'
import ChallengesPage from './pages/gamification/ChallengesPage'
import RewardsPage from './pages/gamification/RewardsPage'
import BadgesPage from './pages/gamification/BadgesPage'

import OrganizationDashboard from './pages/scoring/OrganizationDashboard'
import ReportsPage from './pages/scoring/ReportsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes inside Shell Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Environmental Module Routes */}
              <Route path="/environmental" element={<EnvironmentalDashboard />} />
              <Route path="/environmental/factors" element={<EmissionFactors />} />
              <Route path="/environmental/transactions" element={<CarbonTransactions />} />
              <Route path="/environmental/goals" element={<SustainabilityGoals />} />
              <Route path="/environmental/departments" element={<DepartmentTracking />} />

              {/* Social Module Routes */}
              <Route path="/social" element={<SocialCSRActivities />} />
              <Route path="/social/activities" element={<SocialCSRActivities />} />
              <Route path="/social/my-participations" element={<SocialMyParticipation />} />
              <Route path="/social/approvals" element={<SocialApprovals />} />
              <Route path="/social/diversity" element={<SocialDiversity />} />
              <Route path="/social/training" element={<SocialTraining />} />

              {/* Governance Module Routes */}
              <Route path="/governance" element={<GovernanceDashboard />} />
              <Route path="/governance/policies" element={<PoliciesPage />} />
              <Route path="/governance/audits" element={<AuditsPage />} />
              <Route path="/governance/issues" element={<ComplianceIssuesPage />} />

              {/* Gamification Module Routes */}
              <Route path="/gamification" element={<GamificationDashboard />} />
              <Route path="/gamification/challenges" element={<ChallengesPage />} />
              <Route path="/gamification/rewards" element={<RewardsPage />} />
              <Route path="/gamification/badges" element={<BadgesPage />} />

              {/* Scoring & Executive Dashboard Module Routes */}
              <Route path="/scoring" element={<OrganizationDashboard />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<Settings />} />

              {/* Admin Only Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/departments" element={<Departments />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/users" element={<UserManagement />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
