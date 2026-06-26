import React from 'react'
import { TrendingUp, MessageCircle, Award, Users, Play, ChevronRight, LogOut } from 'lucide-react'
import type { Profile } from '../types'
import { useStats } from '../hooks/useStats'
import {
  UserRole,
  ROLE_LABELS,
  ROLE_BANNER,
  CLIENT_PROFILE_NAMES,
  UI_MESSAGES,
} from '../constants'

interface DashboardProps {
  profile: Profile
  onStartSimulation: () => void
  onGoToProfile: () => void
  onSignOut: () => void
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export function Dashboard({ profile, onStartSimulation, onGoToProfile, onSignOut }: DashboardProps) {
  const { stats, loading } = useStats(profile)

  const isAdmin   = profile.role === UserRole.Admin
  const isManager = profile.role === UserRole.Manager
  const isVendedor = profile.role === UserRole.Vendedor

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : profile.email[0].toUpperCase()

  const sessionsSub  = isAdmin ? UI_MESSAGES.dashboard.subPlatform : isManager ? UI_MESSAGES.dashboard.subTeam : UI_MESSAGES.dashboard.subOwn
  const bannerText   = ROLE_BANNER[profile.role]

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#128C7E]">WhatsCoach</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ROLE_LABELS[profile.role]}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToProfile}
            className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-xs font-bold">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                : initials
              }
            </div>
            <span className="text-sm text-slate-600 font-medium hidden sm:block">
              {profile.full_name || profile.email}
            </span>
          </button>
          <button
            onClick={onSignOut}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-50"
            title={UI_MESSAGES.dashboard.signOut}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {profile.full_name ? `Hola, ${profile.full_name.split(' ')[0]} 👋` : UI_MESSAGES.dashboard.welcome}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{UI_MESSAGES.dashboard.activitySummary}</p>
          </div>
          {isVendedor && (
            <button
              onClick={onStartSimulation}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
            >
              <Play className="h-4 w-4" />
              {UI_MESSAGES.dashboard.newSimulation}
            </button>
          )}
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<MessageCircle className="h-5 w-5" />}
              label={UI_MESSAGES.dashboard.statSessions}
              value={stats.totalSessions}
              sub={sessionsSub}
            />
            <StatCard
              icon={<Award className="h-5 w-5" />}
              label={UI_MESSAGES.dashboard.statEvaluations}
              value={stats.totalEvaluations}
              sub={UI_MESSAGES.dashboard.subCompleted}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label={UI_MESSAGES.dashboard.statAvgScore}
              value={stats.avgScore > 0 ? `${stats.avgScore}/10` : '—'}
              sub={UI_MESSAGES.dashboard.statFinalScore}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label={isAdmin ? UI_MESSAGES.profile.role : 'Equipo'}
              value={isAdmin ? ROLE_LABELS[UserRole.Admin] : isManager ? ROLE_LABELS[UserRole.Manager] : '—'}
              sub={isAdmin ? 'acceso total' : isManager ? 'vista de equipo' : profile.email}
            />
          </div>
        )}

        {/* Actividad reciente */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">{UI_MESSAGES.dashboard.recentSessions}</h2>
            {isVendedor && (
              <button
                onClick={onStartSimulation}
                className="text-[#128C7E] text-xs font-bold flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                {UI_MESSAGES.dashboard.goToSimulator} <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {stats.recentSessions.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-slate-400 text-sm">{UI_MESSAGES.dashboard.noSessions}</p>
              {isVendedor && (
                <button
                  onClick={onStartSimulation}
                  className="mt-3 text-[#25D366] font-bold text-sm hover:opacity-70 transition-opacity"
                >
                  {UI_MESSAGES.dashboard.startFirst}
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {stats.recentSessions.map(s => (
                <li key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm">
                      💬
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {CLIENT_PROFILE_NAMES[s.client_profile as keyof typeof CLIENT_PROFILE_NAMES] ?? s.client_profile}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(s.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {s.score != null ? (
                    <span className={`text-sm font-bold ${s.score >= 7 ? 'text-emerald-500' : s.score >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {s.score}/10
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">{UI_MESSAGES.dashboard.noScore}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Banner admin/manager */}
        {bannerText && (
          <div className="bg-[#128C7E]/10 border border-[#128C7E]/20 rounded-2xl px-6 py-4">
            <p className="text-sm font-bold text-[#128C7E]">{bannerText}</p>
          </div>
        )}

      </div>
    </div>
  )
}
