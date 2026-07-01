import { useState, useEffect, useRef } from 'react'
import { UserCircle, Pencil, Save, X, Camera } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useUpdatePatient } from '../../hooks/usePatients'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import { Input, Select } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { getInitials } from '../../utils/helpers'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export const ProfilePage = () => {
  const { patient, profile, user } = useAuth()
  const updateMutation = useUpdatePatient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', age: '', gender: 'male' })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || '',
        phone: patient.phone || '',
        age: patient.age || '',
        gender: patient.gender || 'male',
      })
      setAvatarUrl(patient.avatar_url || null)
    }
  }, [patient])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl
      await supabase.from('patients').update({ avatar_url: url }).eq('user_id', user.id)
      setAvatarUrl(url)
      toast.success('Profile picture updated')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({ id: patient.id, ...form, age: parseInt(form.age) })
      toast.success('Profile updated successfully')
      setEditing(false)
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setForm({
      name: patient.name || '',
      phone: patient.phone || '',
      age: patient.age || '',
      gender: patient.gender || 'male',
    })
    setEditing(false)
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {/* Avatar card */}
        <Card>
          <CardBody className="p-6 text-center">
            <div className="relative inline-block mb-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">{getInitials(patient?.name)}</span>
                </div>
              )}
              {editing && (
                <button
                  onClick={() => fileRef.current.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <p className="font-bold text-gray-900 text-lg">{patient?.name}</p>
            <p className="text-gray-500 text-sm">{profile?.email}</p>
            <span className="mt-2 inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full capitalize">
              {profile?.role}
            </span>
          </CardBody>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-600" /> Personal Details
            </h2>
          </CardHeader>
          <CardBody>
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Full Name" value={form.name} onChange={set('name')} required />
                <Input label="Phone Number" value={form.phone} onChange={set('phone')} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Age" type="number" min="1" max="120" value={form.age} onChange={set('age')} required />
                  <Select label="Gender" value={form.gender} onChange={set('gender')}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" loading={updateMutation.isPending} className="flex-1">
                    <Save className="w-4 h-4" /> Save
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel} className="flex-1">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {[
                  ['Full Name', patient?.name],
                  ['Phone Number', patient?.phone],
                  ['Age', patient?.age ? `${patient.age} yrs` : '—'],
                  ['Gender', patient?.gender],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}
