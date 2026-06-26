import { useEffect, useState, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './components/auth/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { ProfilePage } from './pages/ProfilePage'
import { AdminCompanyPage } from './pages/AdminCompanyPage'
import { getMaintenanceMode } from './lib/db'
import { UserRole } from './constants'
import App from './App'

const COUNTDOWN = 30

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function MaintenanceScreen({ onDone }: { onDone: () => void }) {
  const [seconds, setSeconds] = useState(COUNTDOWN)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(ref.current!); onDone(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(ref.current!)
  }, [onDone])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="text-center space-y-6 max-w-sm w-full p-8 bg-gray-900 border border-gray-800 rounded-3xl shadow-xl">
        <div className="text-5xl">🔧</div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Plataforma en mantenimiento</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Estamos realizando mejoras. El servicio estará disponible pronto.
          </p>
        </div>
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(seconds / COUNTDOWN) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Serás redirigido en <span className="text-emerald-400 font-bold tabular-nums">{seconds}s</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile(user)
  const navigate = useNavigate()
  if (!profile) return <Spinner />
  return (
    <Dashboard
      profile={profile}
      onStartSimulation={() => navigate('/simulator')}
      onGoToProfile={() => navigate('/profile')}
      onSignOut={signOut}
    />
  )
}

function SimulatorPage() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile(user)
  const navigate = useNavigate()
  if (!user) return <Spinner />
  return (
    <App
      user={user}
      profile={profile}
      onSignOut={signOut}
      onBackToDashboard={() => navigate('/dashboard')}
    />
  )
}

function ProfilePageWrapper() {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile(user)
  const navigate = useNavigate()
  const [, setMaintenanceMode] = useState(false)
  if (!profile) return <Spinner />
  return (
    <ProfilePage
      profile={profile}
      onBack={() => navigate('/dashboard')}
      onUpdated={updateProfile}
      onMaintenanceChange={setMaintenanceMode}
    />
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getMaintenanceMode().then(v => { setMaintenanceMode(v); setMaintenanceLoading(false) })
  }, [])

  if (loading || maintenanceLoading || (user && profileLoading)) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Spinner />
  if (maintenanceMode && profile.role !== UserRole.Admin) {
    return <MaintenanceScreen onDone={() => navigate('/login')} />
  }

  return <>{children}</>
}

export function Root() {
  const { user, loading } = useAuth()
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => { getMaintenanceMode().then(setMaintenanceMode) }, [])

  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to="/dashboard" replace /> : <HomePage onLogin={() => {}} />
      } />
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <LoginPage maintenanceMode={maintenanceMode} />
      } />

      <Route path="/dashboard"                    element={<AuthGuard><DashboardPage /></AuthGuard>} />
      <Route path="/simulator"                    element={<AuthGuard><SimulatorPage /></AuthGuard>} />
      <Route path="/profile"                      element={<AuthGuard><ProfilePageWrapper /></AuthGuard>} />
      <Route path="/admin/companies/:companyId"   element={<AuthGuard><AdminCompanyPage /></AuthGuard>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
