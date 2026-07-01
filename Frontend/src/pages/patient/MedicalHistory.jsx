import { useState } from 'react'
import { FileText, Download, Pill, Stethoscope } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useMedicalRecords, useReports } from '../../hooks/useMedicalRecords'
import { Layout } from '../../components/common/Layout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/helpers'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'

const REPORT_CATEGORIES = {
  blood_test: 'Blood Test',
  xray: 'X-Ray',
  mri_ct: 'MRI / CT Scan',
  ecg: 'ECG',
  ultrasound: 'Ultrasound',
  other: 'Other',
}

const downloadPrescription = (rec, patientName) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
    const w = doc.internal.pageSize.getWidth()

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, w, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('DOCTORIFY HOSPITAL', w / 2, 12, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Prescription', w / 2, 20, { align: 'center' })

    doc.setTextColor(60, 60, 60)
    doc.setFontSize(9)
    doc.text(`Patient: ${patientName}`, 10, 36)
    doc.text(`Date: ${formatDate(rec.created_at)}`, w - 10, 36, { align: 'right' })

    doc.setDrawColor(200, 200, 200)
    doc.line(10, 40, w - 10, 40)

    let y = 48
    if (rec.diagnosis) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Diagnosis', 10, y); y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(rec.diagnosis, w - 20)
      doc.text(lines, 10, y); y += lines.length * 5 + 6
    }
    if (rec.prescription) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Prescription', 10, y); y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(rec.prescription, w - 20)
      doc.text(lines, 10, y); y += lines.length * 5 + 6
    }
    if (rec.notes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Notes', 10, y); y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(rec.notes, w - 20)
      doc.text(lines, 10, y)
    }

    doc.save(`Prescription-${formatDate(rec.created_at)}.pdf`)
  } catch {
    toast.error('Failed to generate PDF')
  }
}

export const MedicalHistory = () => {
  const { patient } = useAuth()
  const { data: records, isLoading: loadingRecords } = useMedicalRecords(patient?.id)
  const { data: reports, isLoading: loadingReports } = useReports(patient?.id)
  const [tab, setTab] = useState('records')

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical History</h1>

        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: 'records', label: 'Records & Prescriptions', icon: FileText },
            { key: 'reports', label: 'Reports', icon: Download },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'records' && (
          <div className="space-y-4">
            {loadingRecords ? <LoadingSpinner /> : records?.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No medical records yet</p>
              </div>
            ) : records?.map((rec) => (
              <Card key={rec.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-gray-400">{formatDate(rec.created_at)}</span>
                  <Button size="sm" variant="secondary" onClick={() => downloadPrescription(rec, patient?.name)}>
                    <Download className="w-3.5 h-3.5" /> Prescription PDF
                  </Button>
                </div>
                {rec.diagnosis && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                      <Stethoscope className="w-4 h-4 text-blue-600" /> Diagnosis
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{rec.diagnosis}</p>
                  </div>
                )}
                {rec.prescription && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                      <Pill className="w-4 h-4 text-green-600" /> Prescription
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{rec.prescription}</p>
                  </div>
                )}
                {rec.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{rec.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-3">
            {loadingReports ? <LoadingSpinner /> : reports?.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No reports uploaded yet</p>
              </div>
            ) : reports?.map((rep) => (
              <Card key={rep.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{rep.file_name || 'Report'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{formatDate(rep.created_at)}</p>
                    {rep.category && rep.category !== 'other' && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {REPORT_CATEGORIES[rep.category] || rep.category}
                      </span>
                    )}
                  </div>
                </div>
                <a href={rep.file_url} target="_blank" rel="noreferrer">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
