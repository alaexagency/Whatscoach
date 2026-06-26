import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './components/auth/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { ProfilePage } from './pages/ProfilePage'
import { getMaintenanceMode } from './lib/db'
import { UserRole } from './constants'
import App from './App'

type View = 'dashboard' | 'simulator' | 'profile'

export function Root() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, loading: profileLoading, updateProfile } = useProfile(user)
  const [view, setView] = useState<View>('dashboard')
  const [showLogin, setShowLogin] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    getMaintenanceMode().then(setMaintenanceMode)
  }, [])

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No autenticado
  if (!user) {
    if (showLogin) return <LoginPage maintenanceMode={maintenanceMode} />
    return <HomePage onLogin={() => setShowLogin(true)} />
  }

  // Perfil cargando
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Mantenimiento: mostrar countdown y redirigir al menú
  if (maintenanceMode && profile.role !== UserRole.Admin) {
    return <MaintenanceScreen onDone={signOut} />
  }

  if (view === 'simulator') {
    return (
      <App
        user={user}
        profile={profile}
        onSignOut={signOut}
        onBackToDashboard={() => setView('dashboard')}
      />
    )
  }

  if (view === 'profile') {
    return (
      <ProfilePage
        profile={profile}
        onBack={() => setView('dashboard')}
        onUpdated={updateProfile}
        onMaintenanceChange={setMaintenanceMode}
      />
    )
  }

  return (
    <Dashboard
      profile={profile}
      onStartSimulation={() => setView('simulator')}
      onGoToProfile={() => setView('profile')}
      onSignOut={signOut}
    />
  )
}

const COUNTDOWN = 30

function MaintenanceScreen({ onDone }: { onDone: () => void }) {
  const [seconds, setSeconds] = useState(COUNTDOWN)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(ref.current!)
          onDone()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(ref.current!)
  }, [onDone])

  const progress = (seconds / COUNTDOWN) * 100

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

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Serás redirigido al menú en <span className="text-emerald-400 font-bold tabular-nums">{seconds}s</span>
          </p>
        </div>
      </div>
    </div>
  )
}
