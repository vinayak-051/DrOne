import { useState } from 'react'
import { User, Phone, Calendar } from 'lucide-react'
import { useAllPatients } from '../../hooks/usePatients'
import { Layout } from '../../components/common/Layout'
import { Card } from '../../components/common/Card'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Input } from '../../components/common/Input'
import { getInitials } from '../../utils/helpers'

export const PatientsPage = () => {
  const { data: patients, isLoading } = useAllPatients()
  const [search, setSearch] = useState('')

  const filtered = patients?.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  ) || []

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <span className="text-sm text-gray-400">{patients?.length || 0} total</span>
        </div>

        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Card key={p.id} hover className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">{getInitials(p.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {p.phone}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{p.age}yrs · {p.gender}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
