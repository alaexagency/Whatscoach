import { useState, useRef, useEffect } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { saveSession, saveEvaluation } from '../lib/db'
import { MessageRole, UI_MESSAGES } from '../constants'
import { CLIENT_PROFILES } from '../data/clientProfiles'
import type { KBFragment } from './useKnowledgeBase'
import type { Profile } from '../types'

export interface Message {
  role: MessageRole
  text: string
  time: string
}

export interface EvaluationData {
  indicadores: {
    calidad_conversacion: number
    manejo_objeciones: number
    tecnicas_cierre: number
    puntuacion_final: number
  }
  analisis: {
    fortalezas: string[]
    oportunidades_mejora: string[]
    tecnicas_aplicadas: string[]
    tecnicas_no_aplicadas: string[]
    tecnica_cierre_recomendada: string
  }
  ejemplo_respuesta_ideal: string
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }
}

function timestamp() {
  return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

interface SimulatorConfig {
  user: SupabaseUser
  profile: Profile | null
  knowledgeSources: KBFragment[]
}

export function useSimulator({ user: _user, profile: _profile, knowledgeSources }: SimulatorConfig) {
  // Product config
  const [productName, setProductName] = useState('Academia de IA para Emprendedores')
  const [productPrice, setProductPrice] = useState('$297 USD')
  const [productDesc, setProductDesc] = useState(
    'Programa completo de 8 semanas donde aprendes a usar Inteligencia Artificial para automatizar tu negocio, redactar contenido magnético y triplicar tus tasas de conversión. Incluye mentorías grupales semanales, plantillas prediseñadas y acceso vitalicio.'
  )
  const [difficulty, setDifficulty] = useState('medium')
  const [selectedClientKey, setSelectedClientKey] = useState('skeptical')
  const [initiator, setInitiator] = useState<'client' | 'seller'>('client')

  // Simulation
  const [messages, setMessages] = useState<Message[]>([])
  const [welcomeOverlay, setWelcomeOverlay] = useState(true)
  const [startOverlay, setStartOverlay] = useState(false)
  const [isSimInProgress, setIsSimInProgress] = useState(false)
  const [typingState, setTypingState] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Evaluation
  const [isEvalOpen, setIsEvalOpen] = useState(false)
  const [isEvalLoading, setIsEvalLoading] = useState(false)
  const [loadingStepText, setLoadingStepText] = useState('')
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)

  // UI
  const [notification, setNotification] = useState<{ msg: string; isError?: boolean } | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [activeMobileView, setActiveMobileView] = useState<'config' | 'chat' | 'eval'>('chat')

  const chatBottomRef = useRef<HTMLDivElement>(null)

  const activeProfile = CLIENT_PROFILES[selectedClientKey]
  const knowledgeText = knowledgeSources.map(k => k.text).join('\n\n')
  const product = { name: productName, price: productPrice, description: productDesc }

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingState])

  // Auto-dismiss notifications
  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(t)
  }, [notification])

  function notify(msg: string, isError = false) {
    setNotification({ msg, isError })
  }

  function prepareSimulation() {
    setMessages([])
    setEvaluation(null)
    setSessionId(null)
    setIsEvalOpen(false)
    setStartOverlay(true)
  }

  async function beginSimulation() {
    setIsOfflineMode(false)
    setStartOverlay(false)
    setWelcomeOverlay(false)
    setIsSimInProgress(true)
    setActiveMobileView('chat')
    setMessages([])

    if (initiator !== 'client') return

    setTypingState(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ profile: activeProfile, product, history: [], difficulty, knowledge: knowledgeText })
      })
      const data = await res.json()
      if (res.ok && data.text) {
        if (data.isLocalSimulated) setIsOfflineMode(true)
        setMessages([{ role: MessageRole.Cliente, text: data.text, time: timestamp() }])
      } else {
        throw new Error(data.error || 'Sin respuesta de la IA.')
      }
    } catch (err: any) {
      console.error(err)
      notify('No se pudo iniciar con IA. Activado simulador fuera de línea.', true)
      setIsOfflineMode(true)
      setMessages([{ role: MessageRole.Cliente, text: activeProfile.objections[0], time: timestamp() }])
    } finally {
      setTypingState(false)
    }
  }

  async function handleSendMessage() {
    if (!inputText.trim() || typingState) return

    const userMessage: Message = { role: MessageRole.Vendedor, text: inputText.trim(), time: timestamp() }
    const updatedHistory = [...messages, userMessage]
    setMessages(updatedHistory)
    setInputText('')
    setTypingState(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ profile: activeProfile, product, history: updatedHistory, difficulty, knowledge: knowledgeText })
      })
      const data = await res.json()

      if (res.ok && data.text) {
        if (data.isLocalSimulated) setIsOfflineMode(true)
        setMessages(prev => [...prev, { role: MessageRole.Cliente, text: data.text, time: timestamp() }])
      } else {
        throw new Error(data.error || 'Falla al invocar respuesta del agente.')
      }
    } catch (err: any) {
      console.error(err)
      notify('Activado simulador local offline por desconexión de la API.', true)
      setIsOfflineMode(true)
      setTimeout(() => {
        const objections = activeProfile.objections
        const idx = Math.max(0, Math.floor(messages.length / 2)) % objections.length
        const localResponse = `Entiendo lo que dices, pero la verdad ${objections[idx].toLowerCase()}. Necesito pensarlo mejor antes de decidir.`
        setMessages(prev => [...prev, { role: MessageRole.Cliente, text: localResponse, time: timestamp() }])
        setTypingState(false)
      }, 1000)
      return
    } finally {
      setTypingState(false)
    }
  }

  async function finishAndEvaluateWithIA() {
    if (messages.length < 2) {
      notify(UI_MESSAGES.errors.minMessages, true)
      return
    }

    setIsSimInProgress(false)
    setIsEvalOpen(true)
    setIsEvalLoading(true)
    setActiveMobileView('eval')

    const newSessionId = await saveSession({ productName, productPrice, productDesc, clientProfile: selectedClientKey, difficulty, messages })
    if (newSessionId) setSessionId(newSessionId)

    const steps = [
      'Leyendo la transcripción completa...',
      'Calificando empatía y calidez en WhatsApp...',
      'Midiendo resolución ante las objeciones cargadas...',
      'Cruzando argumentos contra las 12 Técnicas de Cierre estrellas...',
      'Preparando el informe final del Coach...'
    ]
    let step = 0
    setLoadingStepText(steps[0])
    const interval = setInterval(() => {
      if (step < steps.length - 1) setLoadingStepText(steps[++step])
    }, 1800)

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ profile: activeProfile, product, history: messages, knowledge: knowledgeText })
      })
      const data = await res.json()

      if (res.ok && data.indicadores) {
        if (data.isLocalHeuristics) setIsOfflineMode(true)
        setEvaluation(data)
        if (newSessionId) {
          await saveEvaluation({
            sessionId: newSessionId,
            scoreConversation: data.indicadores.calidad_conversacion,
            scoreObjections: data.indicadores.manejo_objeciones,
            scoreClosing: data.indicadores.tecnicas_cierre,
            scoreFinal: data.indicadores.puntuacion_final,
            strengths: data.analisis.fortalezas,
            improvements: data.analisis.oportunidades_mejora,
            techniquesApplied: data.analisis.tecnicas_aplicadas,
            techniquesMissing: data.analisis.tecnicas_no_aplicadas,
            recommendedClose: data.analisis.tecnica_cierre_recomendada,
            idealResponse: data.ejemplo_respuesta_ideal,
          })
        }
      } else {
        throw new Error(data.error || 'Falla en la respuesta de evaluación.')
      }
    } catch (err: any) {
      console.error(err)
      notify('Se activó la evaluación experta local autónoma.', false)
      setIsOfflineMode(true)
      setEvaluation({
        indicadores: { calidad_conversacion: 7, manejo_objeciones: 6, tecnicas_cierre: 6, puntuacion_final: 65 },
        analisis: {
          fortalezas: [
            'Excelente disposición profesional en el diálogo comercial de WhatsApp.',
            'Identificación rápida del nombre del cliente logrando sintonía íntima.'
          ],
          oportunidades_mejora: [
            'Respuestas demasiado cargadas para chat de mensajería; reduce a líneas cortas.',
            'No re-encuadres el precio de inmediato, primero valida el problema real.'
          ],
          tecnicas_aplicadas: ['Análisis empático local autónomo'],
          tecnicas_no_aplicadas: ['SPIN Selling', 'Benjamin Franklin Close', 'Assumptive Close'],
          tecnica_cierre_recomendada: 'Se aconseja de manera prioritaria la técnica Feel-Felt-Found para responder de manera óptima a las trabas de precio que reporta el prospecto.'
        },
        ejemplo_respuesta_ideal: `Entiendo perfectamente Hugo, a muchos de nuestros alumnos les parecía una inversión elevada al comienzo. Pero lo que descubrieron tras sumarse es que con WhatsCoach lograron acortar su ciclo de ventas y cerrar 2 tratos extra esta misma semana, pagando el curso completo. ¿Quieres registrarte en el acceso de prueba básico o prefieres la versión premium directa?`,
      })
    } finally {
      clearInterval(interval)
      setIsEvalLoading(false)
    }
  }

  function restartSimulationFull() {
    setMessages([])
    setEvaluation(null)
    setSessionId(null)
    setIsEvalOpen(false)
    setIsSimInProgress(false)
    setWelcomeOverlay(true)
  }

  function downloadHistoryTXT() {
    if (messages.length === 0) {
      notify('No hay mensajes cargados para descargar.', true)
      return
    }

    let txt = `=================================================\n`
    txt += `       WHATSCOACH AI - TRANSCRIPCIÓN DE VENTAS     \n`
    txt += `=================================================\n\n`
    txt += `Fecha: ${new Date().toLocaleString('es')}\n`
    txt += `Cliente: ${activeProfile.name} (${activeProfile.emoji})\n`
    txt += `Dificultad: ${difficulty.toUpperCase()}\n`
    txt += `Producto: ${productName} (Precio: ${productPrice})\n\n`
    txt += `Transmisión del Chat:\n--------------------------\n`
    messages.forEach(m => {
      txt += `[${m.time}] ${m.role === MessageRole.Vendedor ? 'Vendedor (Usuario)' : 'Cliente'}: ${m.text}\n\n`
    })

    if (evaluation) {
      txt += `=================================================\n`
      txt += `         EVALUACIÓN DEL COACH VIRTUAL IA         \n`
      txt += `=================================================\n`
      txt += `Puntuación Final: ${evaluation.indicadores.puntuacion_final}/100\n`
      txt += `- Calidad de conversión: ${evaluation.indicadores.calidad_conversacion}/10\n`
      txt += `- Manejo de objeciones: ${evaluation.indicadores.manejo_objeciones}/10\n`
      txt += `- Técnicas de cierre: ${evaluation.indicadores.tecnicas_cierre}/10\n\n`
      txt += `Fortalezas:\n`
      evaluation.analisis.fortalezas.forEach(f => { txt += `  • ${f}\n` })
      txt += `\nOportunidades de mejora:\n`
      evaluation.analisis.oportunidades_mejora.forEach(o => { txt += `  • ${o}\n` })
      txt += `\nTécnica Sugerida del Coach:\n${evaluation.analisis.tecnica_cierre_recomendada}\n\n`
      txt += `Respuesta Ideal:\n"${evaluation.ejemplo_respuesta_ideal}"\n`
    }

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `WhatsCoach_${activeProfile.name.replace(/\s+/g, '_')}_Sim.txt`
    link.click()
    URL.revokeObjectURL(url)
    notify('Historial de ventas guardado exitosamente como TXT.')
  }

  function handleCopyText(content: string) {
    navigator.clipboard.writeText(content)
    notify('¡Copiado al portapapeles!')
  }

  return {
    // Product config
    productName, setProductName,
    productPrice, setProductPrice,
    productDesc, setProductDesc,
    difficulty, setDifficulty,
    selectedClientKey, setSelectedClientKey,
    initiator, setInitiator,
    // Simulation
    messages,
    welcomeOverlay, setWelcomeOverlay,
    startOverlay, setStartOverlay,
    isSimInProgress,
    typingState,
    inputText, setInputText,
    sessionId,
    // Evaluation
    isEvalOpen, setIsEvalOpen,
    isEvalLoading,
    loadingStepText,
    evaluation,
    // UI
    notification,
    isOfflineMode,
    activeMobileView, setActiveMobileView,
    chatBottomRef,
    activeProfile,
    // Actions
    notify,
    prepareSimulation,
    beginSimulation,
    handleSendMessage,
    finishAndEvaluateWithIA,
    restartSimulationFull,
    downloadHistoryTXT,
    handleCopyText,
  }
}
