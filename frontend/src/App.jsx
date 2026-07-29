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

import {
  EnvironmentalPage,
  SocialPage,
  GovernancePage,
  GamificationPage,
  ReportsPage,
  SettingsPage
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
              <Route path="/environmental" element={<EnvironmentalPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/gamification" element={<GamificationPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

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
