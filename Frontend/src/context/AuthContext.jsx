import { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      setProfile(data)

      if (data?.role === 'patient') {
        const { data: pat, error: patErr } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        if (patErr) throw patErr
        setPatient(pat)
      }
    } catch (err) {
      setAuthError(err.message)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setPatient(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, name, phone, age, gender }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    await supabase.from('users').insert({ id: data.user.id, email, role: 'patient' })
    await supabase.from('patients').insert({
      user_id: data.user.id,
      name,
      phone,
      age: parseInt(age),
      gender,
    })
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setPatient(null)
  }

  const isAdmin = profile?.role === 'admin'
  const isPatient = profile?.role === 'patient'

  return (
    <AuthContext.Provider value={{ user, profile, patient, loading, authError, signUp, signIn, signOut, isAdmin, isPatient }}>
      {children}
    </AuthContext.Provider>
  )
}
