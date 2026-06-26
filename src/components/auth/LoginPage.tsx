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

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
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

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">o</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {A.continueWithGoogle}
          </button>

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
