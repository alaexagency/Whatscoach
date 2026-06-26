import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { UserRole } from '../constants'
import type { Profile } from '../types'

interface RecentSession {
  id: string
  client_profile: string
  created_at: string
  score?: number
}

interface Stats {
  totalSessions: number
  totalEvaluations: number
  avgScore: number
  recentSessions: RecentSession[]
}

export function useStats(profile: Profile | null) {
  const [stats, setStats] = useState<Stats>({ totalSessions: 0, totalEvaluations: 0, avgScore: 0, recentSessions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchStats(profile.role, profile.id)
  }, [profile])

  async function fetchStats(role: UserRole, userId: string) {
    setLoading(true)

    let sessionQuery = supabase.from('sessions').select('id, client_profile, created_at, company_id')

    if (role === UserRole.Vendedor) {
      sessionQuery = sessionQuery.eq('user_id', userId)
    } else if (role === UserRole.Company) {
      sessionQuery = sessionQuery.eq('company_id', userId)
    }
    // UserRole.Admin ve todo — sin filtro

    const { data: sessions } = await sessionQuery.order('created_at', { ascending: false }).limit(5)

    let evalQuery = supabase.from('evaluations').select('score_final, session_id')
    if (role === UserRole.Vendedor) {
      evalQuery = evalQuery.eq('user_id', userId)
    }

    const { data: evals } = await evalQuery

    const avgScore = evals && evals.length > 0
      ? Math.round(evals.reduce((acc, e) => acc + e.score_final, 0) / evals.length)
      : 0

    const recentWithScore = (sessions || []).map(s => {
      const evaluation = evals?.find(e => e.session_id === s.id)
      return { ...s, score: evaluation?.score_final }
    })

    setStats({
      totalSessions: sessions?.length ?? 0,
      totalEvaluations: evals?.length ?? 0,
      avgScore,
      recentSessions: recentWithScore,
    })
    setLoading(false)
  }

  return { stats, loading }
}
