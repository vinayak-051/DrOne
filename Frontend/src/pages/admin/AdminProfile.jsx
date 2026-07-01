import { useState, useEffect } from 'react'
import { Save, Stethoscope, Phone, Mail, User, Pencil, X, Award, BadgeCheck, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
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
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', specialist: '', phone: '', email: '', experience: '', awards: '', certifications: '' })

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').limit(1).single()
      return data
    },
  })

  useEffect(() => {
    if (doctor) setForm({
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
      if (doctor?.id) {
        const { error } = await supabase.from('doctor_profiles').update(values).eq('id', doctor.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('doctor_profiles').insert(values)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Profile saved')
      qc.invalidateQueries({ queryKey: ['doctor-profile'] })
      setEditing(false)
    },
    onError: () => toast.error('Failed to save profile'),
  })

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

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
              <div className="w-2/5 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-3xl">{getInitials(doctor?.name)}</span>
                </div>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-center space-y-3">
                <div>
                  <p className="text-xl font-bold text-gray-900">{doctor?.name}</p>
                  {doctor?.specialist && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                      <p className="text-sm text-blue-600 font-medium">{doctor.specialist}</p>
                    </div>
                  )}
                </div>
                {doctor?.experience && <InfoRow icon={Clock} label="Experience" value={doctor.experience} />}
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
                <Input label="Experience" value={form.experience} onChange={set('experience')} placeholder="e.g. 15+ years" />
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
