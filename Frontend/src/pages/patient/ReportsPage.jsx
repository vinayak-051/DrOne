import { FileText, ExternalLink, Download } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useReports } from '../../hooks/useMedicalRecords'
import { Layout } from '../../components/common/Layout'
import { Card } from '../../components/common/Card'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/helpers'

const CATEGORY_LABELS = {
  blood_test: 'Blood Test',
  xray: 'X-Ray',
  mri_ct: 'MRI / CT Scan',
  ecg: 'ECG',
  ultrasound: 'Ultrasound',
  other: 'Other',
}

export const ReportsPage = () => {
  const { patient } = useAuth()
  const { data: reports, isLoading } = useReports(patient?.id)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Lab results and medical reports uploaded by your doctor</p>
        </div>

        <Card>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : !reports?.length ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reports yet</p>
                <p className="text-sm text-gray-400 mt-1">Reports uploaded by your doctor will appear here</p>
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{rep.file_name || 'Report'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[rep.category] || rep.category || 'Other'}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(rep.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={rep.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                    <a
                      href={rep.file_url}
                      download={rep.file_name || 'report'}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
