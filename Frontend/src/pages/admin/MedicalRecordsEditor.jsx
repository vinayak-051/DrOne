import { useState } from 'react'
import { Search, Plus, Upload, FileText, Stethoscope, Pill, X } from 'lucide-react'
import { useSearchPatients } from '../../hooks/usePatients'
import { useMedicalRecords, useReports, useAddMedicalRecord, useUploadReport } from '../../hooks/useMedicalRecords'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Input, Textarea } from '../../components/common/Input'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const RecordForm = ({ patientId, onClose }) => {
  const [form, setForm] = useState({ diagnosis: '', prescription: '', notes: '' })
  const addRecord = useAddMedicalRecord()
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addRecord.mutateAsync({ patient_id: patientId, ...form })
      toast.success('Medical record added')
      onClose()
    } catch {
      toast.error('Failed to add record')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea label="Diagnosis" rows={3} value={form.diagnosis} onChange={set('diagnosis')} placeholder="Enter diagnosis..." />
      <Textarea label="Prescription" rows={4} value={form.prescription} onChange={set('prescription')} placeholder="Medicine name, dosage, frequency..." />
      <Textarea label="Notes" rows={2} value={form.notes} onChange={set('notes')} placeholder="Additional notes..." />
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={addRecord.isPending} className="flex-1">Save Record</Button>
      </div>
    </form>
  )
}

const CATEGORIES = [
  { value: 'blood_test', label: 'Blood Test' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'mri_ct', label: 'MRI / CT Scan' },
  { value: 'ecg', label: 'ECG' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'other', label: 'Other' },
]

const ReportUpload = ({ patientId, uploadedBy, onClose }) => {
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('other')
  const uploadReport = useUploadReport()

  const handleUpload = async () => {
    if (!file) return
    try {
      await uploadReport.mutateAsync({ patientId, file, uploadedBy, category })
      toast.success('Report uploaded successfully')
      onClose()
    } catch {
      toast.error('Failed to upload report')
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => document.getElementById('report-upload').click()}
      >
        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{file ? file.name : 'Click to upload PDF or image'}</p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        <input
          id="report-upload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleUpload} disabled={!file} loading={uploadReport.isPending} className="flex-1">
          <Upload className="w-4 h-4" /> Upload
        </Button>
      </div>
    </div>
  )
}

export const MedicalRecordsEditor = () => {
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [modal, setModal] = useState(null)

  const { data: searchResults } = useSearchPatients(query)
  const { data: records, isLoading } = useMedicalRecords(selectedPatient?.id)
  const { data: reports } = useReports(selectedPatient?.id)

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>

        <Card>
          <CardHeader>
            <p className="text-sm text-gray-500">Search and select a patient</p>
          </CardHeader>
          <CardBody>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient by name or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {query.length >= 2 && searchResults && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setQuery('') }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 text-sm"
                  >
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-gray-400 ml-2">{p.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {selectedPatient && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h2>
                <p className="text-sm text-gray-500">{selectedPatient.phone} · {selectedPatient.age}yrs · {selectedPatient.gender}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setModal('upload')}>
                  <Upload className="w-4 h-4" /> Upload Report
                </Button>
                <Button size="sm" onClick={() => setModal('record')}>
                  <Plus className="w-4 h-4" /> Add Record
                </Button>
              </div>
            </div>

            {modal && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-gray-900">
                    {modal === 'record' ? 'Add Medical Record' : 'Upload Report'}
                  </h3>
                </CardHeader>
                <CardBody>
                  {modal === 'record' ? (
                    <RecordForm patientId={selectedPatient.id} onClose={() => setModal(null)} />
                  ) : (
                    <ReportUpload patientId={selectedPatient.id} uploadedBy={profile?.id} onClose={() => setModal(null)} />
                  )}
                </CardBody>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" /> Medical Records ({records?.length || 0})
                </h3>
                {isLoading ? <LoadingSpinner /> : records?.map((rec) => (
                  <Card key={rec.id} className="p-4">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(rec.created_at)}</p>
                    {rec.diagnosis && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> Diagnosis</p>
                        <p className="text-sm text-gray-800">{rec.diagnosis}</p>
                      </div>
                    )}
                    {rec.prescription && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Pill className="w-3 h-3" /> Prescription</p>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{rec.prescription}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" /> Reports ({reports?.length || 0})
                </h3>
                {reports?.map((rep) => (
                  <Card key={rep.id} className="p-4 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{rep.file_name || 'Report'}</p>
                      <p className="text-xs text-gray-400">{formatDate(rep.created_at)}</p>
                    </div>
                    <a href={rep.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">
                      View
                    </a>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
