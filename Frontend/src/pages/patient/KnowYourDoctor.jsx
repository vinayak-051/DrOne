import { Stethoscope, Phone, Mail, AlertCircle, Award, BadgeCheck, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody } from '../../components/common/Card'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { getInitials } from '../../utils/helpers'

export const KnowYourDoctor = () => {
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').limit(1).single()
      return data
    },
  })

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Know Your Doctor</h1>

        {isLoading && <LoadingSpinner size="lg" className="mt-20" />}

        {!isLoading && !doctor && (
          <Card>
            <CardBody className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Doctor profile not available yet.</p>
            </CardBody>
          </Card>
        )}

        {doctor && (
          <>
            {/* Main profile card */}
            <Card className="overflow-hidden">
              <CardBody className="p-0">
                <div className="flex min-h-[260px]">
                  {/* Left — photo / avatar */}
                  <div className="w-2/5 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {doctor.photo_url ? (
                      <img src={doctor.photo_url} alt={doctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-3xl">{getInitials(doctor.name)}</span>
                      </div>
                    )}
                  </div>

                  {/* Right — details */}
                  <div className="flex-1 p-5 flex flex-col justify-center space-y-3">
                    <div>
                      <p className="text-xl font-bold text-gray-900">{doctor.name}</p>
                      {doctor.specialist && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                          <p className="text-sm text-blue-600 font-medium">{doctor.specialist}</p>
                        </div>
                      )}
                    </div>
                    {doctor.experience && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Experience</p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-sm font-semibold text-gray-900">{doctor.experience}</p>
                        </div>
                      </div>
                    )}
                    {doctor.phone && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Contact</p>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-sm font-semibold text-gray-900">{doctor.phone}</p>
                        </div>
                      </div>
                    )}
                    {doctor.email && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Email</p>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-sm font-semibold text-gray-900 break-all">{doctor.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Awards */}
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

            {/* Certifications */}
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
          </>
        )}
      </div>
    </Layout>
  )
}
