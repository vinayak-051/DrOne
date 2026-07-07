import { Suspense } from 'react'
import { Robot3D } from '../components/Robot3D'

export default function RobotDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-6 w-80">
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-4xl">🤖</div>}>
          <Robot3D height={320} />
        </Suspense>
        <p className="text-center text-sm text-blue-500 font-medium mt-2">Medical Assistant · Coming Soon</p>
      </div>
    </div>
  )
}
