import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, DollarSign, Calendar, Hash } from 'lucide-react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { Layout } from '../../components/common/Layout'
import { StatCard, Card, CardHeader, CardBody } from '../../components/common/Card'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/helpers'

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981']

export const AnalyticsDashboard = () => {
  const { data, isLoading } = useAnalytics()

  if (isLoading) return <Layout><LoadingSpinner size="lg" className="mt-20" /></Layout>
  if (!data) return <Layout><div className="text-center mt-20 text-gray-400">No data available</div></Layout>

  const revenueChart = data.revenue_chart || []
  const statusBreakdown = data.status_breakdown || []
  const paymentBreakdown = data.payment_breakdown || []

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Hospital performance metrics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Today's Appointments" value={data.today_count ?? '—'} color="blue" />
          <StatCard icon={TrendingUp} label="This Month" value={data.month_count ?? '—'} color="purple" />
          <StatCard icon={DollarSign} label="Monthly Revenue" value={formatCurrency(data.total_revenue || 0)} color="green" />
          <StatCard icon={Hash} label="OPs (Last 7 Days)" value={data.op_count ?? '—'} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Daily Revenue (Last 7 Days)</h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Appointment Status (This Month)</h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Payment Status (This Month)</h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={paymentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Revenue Summary</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Revenue (This Month)</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(data.total_revenue || 0)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-500">Appointments (Month)</p>
                    <p className="text-xl font-bold text-blue-700">{data.month_count ?? 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-500">Avg. per Day</p>
                    <p className="text-xl font-bold text-purple-700">
                      {data.month_count ? Math.round(data.month_count / 30) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
