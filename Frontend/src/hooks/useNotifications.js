import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

const KEY = 'drone_notifs'
const TTL = 24 * 60 * 60 * 1000

const load = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return raw.filter(n => Date.now() - new Date(n.at).getTime() < TTL)
  } catch { return [] }
}

const persist = (items) => localStorage.setItem(KEY, JSON.stringify(items))

export const useNotifications = (role) => {
  const [items, setItems] = useState(load)
  const qc = useQueryClient()

  const add = useCallback((title, body, type = 'info') => {
    const n = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title, body, type, at: new Date().toISOString(), read: false }
    setItems(prev => { const next = [n, ...prev]; persist(next); return next })
  }, [])

  const markRead = useCallback(() => {
    setItems(prev => { const next = prev.map(n => ({ ...n, read: true })); persist(next); return next })
  }, [])

  const clear = useCallback(() => { setItems([]); localStorage.removeItem(KEY) }, [])

  // Appointments
  useEffect(() => {
    const ch = supabase.channel('notif-appointments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (p) => {
        if (role === 'admin') add('📅 New Appointment', `Appointment booked for ${p.new.date}`, 'appointment')
        else add('📅 Booked', 'Your appointment has been booked successfully', 'appointment')
        qc.invalidateQueries({ queryKey: ['appointments'] })
        qc.invalidateQueries({ queryKey: ['slots'] })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, (p) => {
        const s = p.new.status
        const labels = { confirmed: 'confirmed ✓', completed: 'completed ✓', cancelled: 'cancelled ✗', pending: 'set to pending' }
        if (role === 'admin') {
          if (labels[s]) add('📅 Appointment Updated', `Appointment ${labels[s]} for ${p.new.date}`, 'appointment')
        } else {
          if (s === 'confirmed') add('📅 Appointment Confirmed', 'Your appointment has been confirmed', 'appointment')
          if (s === 'completed') add('📅 Appointment Completed', 'Your visit has been marked complete', 'appointment')
          if (s === 'cancelled') add('📅 Appointment Cancelled', 'Your appointment was cancelled', 'appointment')
        }
        qc.invalidateQueries({ queryKey: ['appointments'] })
        qc.invalidateQueries({ queryKey: ['queue'] })
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [role, add, qc])

  // Patients
  useEffect(() => {
    const ch = supabase.channel('notif-patients')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patients' }, (p) => {
        if (role === 'admin') add('👤 New Patient', `${p.new.name || 'A new patient'} has registered`, 'patient')
        qc.invalidateQueries({ queryKey: ['patients'] })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'patients' }, () => {
        qc.invalidateQueries({ queryKey: ['patients'] })
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [role, add, qc])

  // OP Records / Queue
  useEffect(() => {
    const ch = supabase.channel('notif-op-records')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'op_records' }, (p) => {
        if (role === 'admin') add('🏥 Queue', `OP ${p.new.op_number ? '#' + p.new.op_number : 'record'} added to queue`, 'medical')
        else add('🏥 OP Record Created', 'Your OP record has been created', 'medical')
        qc.invalidateQueries({ queryKey: ['queue'] })
        qc.invalidateQueries({ queryKey: ['appointments'] })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'op_records' }, () => {
        qc.invalidateQueries({ queryKey: ['queue'] })
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [role, add, qc])

  // Medical records
  useEffect(() => {
    const ch = supabase.channel('notif-medical-records')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'medical_records' }, () => {
        if (role === 'patient') add('📋 Medical Record', 'A new medical record has been added to your profile', 'medical')
        else add('📋 Medical Record', 'New medical record added', 'medical')
        qc.invalidateQueries({ queryKey: ['medical-records'] })
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [role, add, qc])

  return { items, unread: items.filter(n => !n.read).length, markRead, clear }
}
