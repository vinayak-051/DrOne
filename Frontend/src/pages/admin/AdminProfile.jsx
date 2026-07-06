import { useState, useEffect, useRef } from 'react'
import { Save, Stethoscope, Phone, Mail, User, Pencil, X, Award, BadgeCheck, Clock, Camera } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import logo from '../../assets/logo.png'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { getInitials } from '../../utils/helpers'
import toast from 'react-hot-toast'

const InfoRow = ({ icon: Icon, label, value }) => (
  <div>
    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
    <div className="flex items-start gap-1.5">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  </div>
)

export const AdminProfile = () => {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', specialist: '', phone: '', email: '', experience: '', awards: '', certifications: '' })

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctor_profiles').select('*').limit(1)
      if (error) throw error
      return data?.[0] || null
    },
  })

  useEffect(() => {
    if (doctor && !editing) setForm({
      name: doctor.name || '',
      specialist: doctor.specialist || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      experience: doctor.experience || '',
      awards: doctor.awards || '',
      certifications: doctor.certifications || '',
    })
  }, [doctor])

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const { data: rows } = await supabase.from('doctor_profiles').select('id').limit(1)
      const existingId = doctor?.id || rows?.[0]?.id
      if (existingId) {
        const { data, error } = await supabase.from('doctor_profiles').update(values).eq('id', existingId).select().single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase.from('doctor_profiles').insert(values).select().single()
        if (error) throw error
        return data
      }
    },
    onSuccess: (saved) => {
      toast.success('Profile saved')
      qc.setQueryData(['doctor-profile'], (old) => ({ ...old, ...saved }))
      setEditing(false)
    },
    onError: (err) => toast.error(err?.message || 'Failed to save profile'),
  })

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Photo must be under 5MB')

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `doctor-photo-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('doctor-photos')
        .upload(path, file, { contentType: file.type })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('doctor-photos').getPublicUrl(path)

      const id = doctor?.id
      if (id) {
        const { error } = await supabase.from('doctor_profiles').update({ photo_url: publicUrl }).eq('id', id)
        if (error) throw error
      }
      await qc.invalidateQueries({ queryKey: ['doctor-profile'] })
      toast.success('Photo updated')
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const calcExperience = (dateStr) => {
    if (!dateStr) return null
    const start = new Date(dateStr)
    if (isNaN(start)) return dateStr
    const now = new Date()
    let years = now.getFullYear() - start.getFullYear()
    let months = now.getMonth() - start.getMonth()
    if (months < 0) { years--; months += 12 }
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    saveMutation.mutate(form)
  }

  if (isLoading) return <Layout><LoadingSpinner size="lg" className="mt-20" /></Layout>

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Pencil className="w-4 h-4" /> Edit</>}
          </button>
        </div>

        {/* Profile card */}
        <Card className="overflow-hidden">
          <CardBody className="p-0">
            <div className="flex min-h-[260px]">
              <div className="w-2/5 flex-shrink-0 bg-gray-100 flex flex-col items-center justify-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <div
                  className={`relative ${editing ? 'cursor-pointer' : ''}`}
                  onClick={() => editing && fileRef.current?.click()}
                >
                  {doctor?.photo_url ? (
                    <img
                      src={doctor.photo_url}
                      alt="Doctor"
                      className="w-24 h-24 rounded-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                  ) : null}
                  <div
                    className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center"
                    style={{ display: doctor?.photo_url ? 'none' : 'flex' }}
                  >
                    <span className="text-blue-600 font-bold text-3xl">{getInitials(doctor?.name)}</span>
                  </div>
                  {editing && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      {uploading
                        ? <LoadingSpinner size="sm" className="text-white" />
                        : <Camera className="w-6 h-6 text-white" />}
                    </div>
                  )}
                </div>
                {editing && <p className="text-xs text-gray-500 font-medium">Tap to change photo</p>}
              </div>
              <div className="flex-1 p-5 flex flex-col justify-center space-y-3 relative overflow-hidden">
                <img src={logo} alt="" aria-hidden className="absolute right-2 bottom-2 w-20 h-20 object-contain opacity-20 pointer-events-none select-none" />
                <div>
                  <p className="text-xl font-bold text-gray-900">{doctor?.name}</p>
                  {doctor?.specialist && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                      <p className="text-sm text-blue-600 font-medium">{doctor.specialist}</p>
                    </div>
                  )}
                </div>
                {doctor?.experience && <InfoRow icon={Clock} label="Experience" value={calcExperience(doctor.experience)} />}
                {doctor?.phone && <InfoRow icon={Phone} label="Contact" value={doctor.phone} />}
                {doctor?.email && <InfoRow icon={Mail} label="Email" value={doctor.email} />}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Awards & Certifications */}
        {(doctor?.awards || doctor?.certifications) && (
          <div className="grid grid-cols-1 gap-4">
            {doctor.awards && (
              <Card>
                <CardBody className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-gray-900">Awards</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{doctor.awards}</p>
                </CardBody>
              </Card>
            )}
            {doctor.certifications && (
              <Card>
                <CardBody className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BadgeCheck className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-gray-900">Certifications</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{doctor.certifications}</p>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> Edit Details
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Full Name" value={form.name} onChange={set('name')} required />
                <Input label="Specialization" value={form.specialist} onChange={set('specialist')} />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Date of Commencement of Practice</label>
                  <input
                    type="date"
                    value={form.experience}
                    onChange={set('experience')}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {form.experience && (
                    <p className="text-xs text-blue-600 mt-1">Experience: {calcExperience(form.experience)}</p>
                  )}
                </div>
                <Input label="Contact Number" value={form.phone} onChange={set('phone')} />
                <Input label="Email" type="email" value={form.email} onChange={set('email')} />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Awards</label>
                  <textarea
                    value={form.awards}
                    onChange={set('awards')}
                    rows={3}
                    placeholder="e.g. Best Urologist Award 2022&#10;Gold Medal – AIIMS 2018"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Certifications</label>
                  <textarea
                    value={form.certifications}
                    onChange={set('certifications')}
                    rows={3}
                    placeholder="e.g. MCh – Urology, AIIMS&#10;FRCS – Edinburgh"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <Button type="submit" loading={saveMutation.isPending} className="w-full">
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </Layout>
  )
}
