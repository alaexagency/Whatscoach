import { useNavigate } from 'react-router-dom'
import { MessageCircle, TrendingUp, Award, Users, ChevronRight, CheckCircle2 } from 'lucide-react'
import {
  ClientProfileKey,
  CLIENT_PROFILE_NAMES,
  CLIENT_PROFILE_EMOJIS,
  CLIENT_PROFILE_DESCS,
} from '../constants'

interface HomePageProps {
  onLogin?: () => void
}

const FEATURES = [
  {
    icon: <MessageCircle className="h-6 w-6 text-[#25D366]" />,
    title: 'Simulación real de WhatsApp',
    desc: 'Practica ventas con clientes IA que replican objeciones y comportamientos reales.',
  },
  {
    icon: <Award className="h-6 w-6 text-amber-500" />,
    title: 'Evaluación con IA',
    desc: 'Recibe un análisis profundo de tu desempeño con las 12 técnicas de cierre maestras.',
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
    title: 'Seguimiento de progreso',
    desc: 'Visualiza tu evolución sesión a sesión y detecta dónde mejorar.',
  },
  {
    icon: <Users className="h-6 w-6 text-purple-500" />,
    title: 'Gestión de equipos',
    desc: 'Los managers monitorizan el rendimiento de sus vendedores en tiempo real.',
  },
]

const PROFILES = Object.values(ClientProfileKey).map(key => ({
  key,
  emoji: CLIENT_PROFILE_EMOJIS[key],
  name:  CLIENT_PROFILE_NAMES[key],
  desc:  CLIENT_PROFILE_DESCS[key],
}))

const STEPS = [
  { num: '01', title: 'Configura tu producto', desc: 'Define nombre, precio y descripción de lo que quieres vender.' },
  { num: '02', title: 'Elige tu cliente', desc: 'Selecciona el perfil de cliente con el que quieres practicar.' },
  { num: '03', title: 'Simula la conversación', desc: 'Chatea como si fuera WhatsApp real. La IA responde con objeciones reales.' },
  { num: '04', title: 'Recibe tu evaluación', desc: 'Obtén un informe detallado con score, fortalezas y áreas de mejora.' },
]

export function HomePage({ onLogin }: HomePageProps) {
  const navigate = useNavigate()
  const goToLogin = () => { onLogin?.(); navigate('/login') }
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#128C7E]">WhatsCoach</span>
          </div>
          <button
            onClick={goToLogin}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors shadow-sm"
          >
            Iniciar sesión
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-[#25D366]/10 text-[#128C7E] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
            Coach de ventas con IA
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            Entrena tus ventas<br />
            <span className="text-[#128C7E]">como en WhatsApp</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Simula conversaciones reales con clientes difíciles, recibe evaluaciones de IA y mejora tus cierres de venta sesión a sesión.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={goToLogin}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-green-200"
            >
              Empezar gratis
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={goToLogin}
              className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-8 py-4 rounded-2xl text-base transition-colors"
            >
              Ver demo
            </button>
          </div>
        </div>
      </section>

      {/* Perfiles de clientes */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-8">
            6 tipos de clientes para practicar
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PROFILES.map(p => (
              <div key={p.name} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl text-center hover:bg-slate-100 transition-colors">
                <span className="text-3xl mb-2">{p.emoji}</span>
                <p className="text-xs font-bold text-slate-700">{p.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">
            Todo lo que necesitas para cerrar más ventas
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex gap-4">
                <div className="mt-0.5 shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {STEPS.map(s => (
              <div key={s.num} className="flex gap-4">
                <span className="text-3xl font-extrabold text-slate-100 shrink-0 leading-none">{s.num}</span>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 técnicas */}
      <section className="py-16 px-6 bg-[#128C7E]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">
            Basado en las 12 técnicas de cierre maestras
          </h2>
          <p className="text-[#d1f7f0] text-sm mb-6">
            Straight Line · SPIN Selling · Feel-Felt-Found · Assumptive Close · Urgencia Real · Prueba Social · Reframing · Alternative Close · Cialdini · Pain Agitate Solve · Takeaway · Benjamin Franklin
          </p>
          {[
            'Analiza cada mensaje tuyo en tiempo real',
            'Detecta qué técnicas usas y cuáles omites',
            'Te sugiere la respuesta ideal al final',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 justify-center mb-2">
              <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
              <span className="text-white text-sm">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Empieza a entrenar hoy
          </h2>
          <p className="text-slate-500 mb-8">
            Crea tu cuenta gratis y haz tu primera simulación en menos de 2 minutos.
          </p>
          <button
            onClick={goToLogin}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-green-200 mx-auto"
          >
            Crear cuenta gratis
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 text-center">
        <p className="text-slate-400 text-sm">
          © {new Date().getFullYear()} WhatsCoach · Simulador de ventas con IA
        </p>
      </footer>

    </div>
  )
}
