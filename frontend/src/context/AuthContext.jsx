import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  // Fetch database user profile with role from backend
  const fetchProfile = async (accessToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
      } else {
        console.error('Failed to fetch profile:', res.statusText)
        setProfile(null)
      }
    } catch (err) {
      console.error('Error fetching backend user profile:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        fetchProfile(session.access_token).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        fetchProfile(session.access_token).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign up - defaults to Employee role automatically
  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) throw error

    // Fetch updated session and profile after signup
    if (data?.session?.access_token) {
      await fetchProfile(data.session.access_token)
    }

    return data
  }

  // Sign in
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error

    if (data?.session?.access_token) {
      await fetchProfile(data.session.access_token)
    }
    return data
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error)
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  // Refresh profile (used after role updates or profile changes)
  const refreshProfile = async () => {
    if (session?.access_token) {
      await fetchProfile(session.access_token)
    }
  }

  const value = {
    user,
    session,
    profile,
    role: profile?.role || 'Employee',
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    token: session?.access_token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
