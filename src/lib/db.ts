import { supabase } from './supabase'

export async function getMaintenanceMode(): Promise<boolean> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()
  return data?.value === 'true'
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await supabase
    .from('app_settings')
    .update({ value: String(enabled), updated_at: new Date().toISOString() })
    .eq('key', 'maintenance_mode')
}

interface SaveSessionParams {
  productName: string
  productPrice: string
  productDesc: string
  clientProfile: string
  difficulty: string
  messages: { role: string; text: string; time: string }[]
}

interface SaveEvaluationParams {
  sessionId: string
  scoreConversation: number
  scoreObjections: number
  scoreClosing: number
  scoreFinal: number
  strengths: string[]
  improvements: string[]
  techniquesApplied: string[]
  techniquesMissing: string[]
  recommendedClose: string
  idealResponse: string
}

export async function saveSession(params: SaveSessionParams): Promise<string | null> {
  // user_id lo provee Supabase RLS desde el JWT — no se acepta del cliente
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  console.log('🔷 Llamando a Supabase (sessions.insert)...');
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      product_name: params.productName,
      product_price: params.productPrice,
      product_desc: params.productDesc,
      client_profile: params.clientProfile,
      difficulty: params.difficulty,
      messages: params.messages,
    })
    .select('id')
    .single()

  console.log('✅ Data:', data);
  console.log('❌ Error:', error);
  if (error) {
    console.error('Error guardando sesión:', error.message)
    return null
  }

  return data.id
}

export async function saveEvaluation(params: SaveEvaluationParams): Promise<boolean> {
  // user_id lo provee Supabase RLS desde el JWT — no se acepta del cliente
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  console.log('🔷 Llamando a Supabase (evaluations.insert)...');
  const { error } = await supabase
    .from('evaluations')
    .insert({
      session_id: params.sessionId,
      user_id: user.id,
      score_conversation: params.scoreConversation,
      score_objections: params.scoreObjections,
      score_closing: params.scoreClosing,
      score_final: params.scoreFinal,
      strengths: params.strengths,
      improvements: params.improvements,
      techniques_applied: params.techniquesApplied,
      techniques_missing: params.techniquesMissing,
      recommended_close: params.recommendedClose,
      ideal_response: params.idealResponse,
    })

  console.log('❌ Error evaluación:', error);
  if (error) {
    console.error('Error guardando evaluación:', error.message)
    return false
  }

  return true
}
