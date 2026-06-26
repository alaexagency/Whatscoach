import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { UI_MESSAGES } from "../../constants"

type Mode = "signin" | "signup" | "reset"

const A = UI_MESSAGES.auth

interface LoginPageProps {
  maintenanceMode?: boolean
}

export function LoginPage({ maintenanceMode = false }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === "signup") {
        if (maintenanceMode) {
          setError(A.maintenance)
          setLoading(false)
          return
        }
        const allowedDomain = import.meta.env.VITE_ALLOWED_SIGNUP_DOMAIN
        if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
          throw new Error(UI_MESSAGES.errors.domainNotAllowed(allowedDomain))
        }
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage(A.checkEmail)
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setMessage(A.resetLinkSent)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = loading
    ? A.loading
    : mode === "signin" ? A.signIn
    : mode === "signup" ? A.signUp
    : A.sendLink

  const title = mode === "signin" ? A.signIn : mode === "signup" ? A.signUp : A.resetPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 rounded-2xl mb-4 text-3xl">
            💬
          </div>
          <h1 className="text-2xl font-bold text-white">WhatsCoach</h1>
          <p className="text-gray-400 text-sm mt-1">Simulador de ventas por WhatsApp con IA</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-white font-semibold mb-5 text-center">{title}</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder={A.signIn === title ? A.signIn : 'Correo electrónico'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {mode !== "reset" && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {error && <p className="text-rose-400 text-xs">{error}</p>}
            {message && <p className="text-emerald-400 text-xs">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {submitLabel}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            {mode === "signin" && (
              <>
                {!maintenanceMode && (
                  <button onClick={() => setMode("signup")} className="text-xs text-gray-400 hover:text-white transition-colors block w-full">
                    {A.noAccount} <span className="text-emerald-400">{A.register}</span>
                  </button>
                )}
                <button onClick={() => setMode("reset")} className="text-xs text-gray-500 hover:text-gray-300 transition-colors block w-full">
                  {A.forgotPassword}
                </button>
              </>
            )}
            {(mode === "signup" || mode === "reset") && (
              <button onClick={() => setMode("signin")} className="text-xs text-gray-400 hover:text-white transition-colors">
                {A.backToSignIn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
