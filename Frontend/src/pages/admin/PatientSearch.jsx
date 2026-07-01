import { useState } from 'react'
import { Search, User, Phone, FileText, Calendar } from 'lucide-react'
import { useSearchPatients } from '../../hooks/usePatients'
import { useMedicalRecords, useReports } from '../../hooks/useMedicalRecords'
import { useAppointments } from '../../hooks/useAppointments'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody } from '../../components/common/Card'
import { Badge, statusBadge } from '../../components/common/Badge'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/helpers'

const PatientDetail = ({ patient }) => {
  const { data: records } = useMedicalRecords(patient.id)
  const { data: reports } = useReports(patient.id)
  const { data: appointments } = useAppointments(patient.id)

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Age', value: `${patient.age} yrs` },
          { label: 'Gender', value: patient.gender },
          { label: 'Phone', value: patient.phone },
          { label: 'Records', value: records?.length || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-semibold text-gray-900 capitalize">{value}</p>
          </div>
        ))}
      </div>

      {appointments?.slice(0, 3).map((appt) => {
        const { variant, label } = statusBadge(appt.status)
        const op = (Array.isArray(appt.op_records) ? appt.op_records[0] : appt.op_records || null)
        return (
          <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{formatDate(appt.date)} · {formatTime(appt.time_slot)}</p>
              {op && <p className="text-xs font-mono text-blue-600">{op.op_number}</p>}
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>
        )
      })}

      {records?.slice(0, 2).map((rec) => (
        <div key={rec.id} className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-400 mb-1">{formatDate(rec.created_at)}</p>
          {rec.diagnosis && <p className="text-sm font-medium text-blue-900">{rec.diagnosis}</p>}
          {rec.prescription && <p className="text-xs text-blue-700 mt-1">{rec.prescription}</p>}
        </div>
      ))}
    </div>
  )
}

export const PatientSearch = () => {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const { data: results, isLoading } = useSearchPatients(query)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Search</h1>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone number, or OP number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>

        {query.length >= 2 && (
          <div className="space-y-3">
            {isLoading ? (
              <LoadingSpinner />
            ) : results?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No patients found for &quot;{query}&quot;</p>
              </div>
            ) : (
              results?.map((patient) => (
                <Card key={patient.id} hover>
                  <CardBody>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpanded(expanded === patient.id ? null : patient.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {patient.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                          {patient.gender} · {patient.age}yrs
                        </span>
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    {expanded === patient.id && <PatientDetail patient={patient} />}
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Search for patients</p>
            <p className="text-sm mt-1">Enter name, phone, or OP number</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
