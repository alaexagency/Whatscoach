import React, { useState, useEffect } from 'react'
import { ArrowLeft, Camera, Save, Lock, Wrench } from 'lucide-react'
import type { Profile } from '../types'
import { supabase } from '../lib/supabase'
import { ROLE_LABELS, ROLE_COLORS, UI_MESSAGES, UserRole } from '../constants'
import { getMaintenanceMode, setMaintenanceMode } from '../lib/db'

interface ProfilePageProps {
  profile: Profile
  onBack: () => void
  onUpdated: (updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>) => void
  onMaintenanceChange?: (enabled: boolean) => void
}

const M = UI_MESSAGES.profile

export function ProfilePage({ profile, onBack, onUpdated, onMaintenanceChange }: ProfilePageProps) {
  const [fullName, setFullName] = useState(profile.full_name)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const [maintenance, setMaintenance] = useState(false)
  const [savingMaintenance, setSavingMaintenance] = useState(false)

  useEffect(() => {
    if (profile.role === UserRole.Admin) {
      getMaintenanceMode().then(setMaintenance)
    }
  }, [profile.role])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      setError(M.saveError)
    } else {
      onUpdated({ full_name: fullName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: M.passwordMismatch, ok: false })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: M.passwordTooShort, ok: false })
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordMsg({ text: error.message, ok: false })
    } else {
      setPasswordMsg({ text: M.passwordUpdated, ok: true })
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  async function handleToggleMaintenance() {
    setSavingMaintenance(true)
    const next = !maintenance
    await setMaintenanceMode(next)
    setMaintenance(next)
    onMaintenanceChange?.(next)
    setSavingMaintenance(false)
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : profile.email[0].toUpperCase()

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">{M.title}</h1>
        </div>

        {/* Avatar + rol */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-xl font-bold">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
                : initials
              }
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center">
              <Camera className="h-3 w-3 text-slate-400" />
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">{fullName || M.noName}</p>
            <p className="text-slate-400 text-sm">{profile.email}</p>
            <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_COLORS[profile.role]}`}>
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
        </div>

        {/* Editar datos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-700 text-sm mb-4">{M.personalInfo}</h2>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {M.fullName}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={M.fullName}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#128C7E] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {M.email}
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            {error && <p className="text-rose-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#128C7E] hover:bg-[#0c6b60] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? M.saving : saved ? M.saved : M.saveChanges}
            </button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            {M.changePassword}
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={M.newPassword}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#128C7E] transition-colors"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={M.confirmPassword}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#128C7E] transition-colors"
            />
            {passwordMsg && (
              <p className={`text-xs ${passwordMsg.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                {passwordMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Lock className="h-4 w-4" />
              {savingPassword ? M.updating : M.updatePassword}
            </button>
          </form>
        </div>

        {/* Info de cuenta */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-700 text-sm mb-3">{M.account}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">{M.memberSince}</span>
              <span className="text-slate-700 font-medium">
                {new Date(profile.created_at).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{M.role}</span>
              <span className="text-slate-700 font-medium">{ROLE_LABELS[profile.role]}</span>
            </div>
          </div>
        </div>

        {/* Modo mantenimiento — solo admin */}
        {profile.role === UserRole.Admin && (
          <div className={`rounded-2xl p-6 border shadow-sm transition-colors ${
            maintenance
              ? 'bg-rose-50 border-rose-200'
              : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  maintenance ? 'bg-rose-100' : 'bg-slate-100'
                }`}>
                  <Wrench className={`h-4 w-4 ${maintenance ? 'text-rose-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${maintenance ? 'text-rose-800' : 'text-slate-700'}`}>
                    Modo mantenimiento
                  </p>
                  <p className={`text-xs mt-0.5 ${maintenance ? 'text-rose-600' : 'text-slate-400'}`}>
                    {maintenance
                      ? 'Activo — solo tú puedes acceder'
                      : 'Desactivado — plataforma operativa'}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={handleToggleMaintenance}
                disabled={savingMaintenance}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                  maintenance ? 'bg-rose-500' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  maintenance ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {maintenance && (
              <p className="text-xs text-rose-600 mt-3 leading-relaxed border-t border-rose-200 pt-3">
                ⚠️ Los usuarios no pueden registrarse ni iniciar sesión. Desactiva el modo mantenimiento cuando termines los cambios.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
