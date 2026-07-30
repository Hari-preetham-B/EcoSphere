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

import {
  SocialPage,
  GovernancePage,
  GamificationPage,
  ReportsPage,
} from './pages/Placeholders'

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

              <Route path="/social" element={<SocialPage />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/gamification" element={<GamificationPage />} />
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
