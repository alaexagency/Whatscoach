import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface DiagnosticSummary {
  id: string
  vendor_name_raw: string
  vendor_id: string | null
  product_name: string
  score_final: number | null
  created_at: string
}

export interface DiagnosticDetail extends DiagnosticSummary {
  product_price: string
  score_conversation: number | null
  score_objections: number | null
  score_closing: number | null
  strengths: string[]
  improvements: string[]
  techniques_applied: string[]
  techniques_missing: string[]
  recommended_close: string
  ideal_response: string
  parsed_messages: { role: string; text: string; time: string }[]
}

export function useDiagnostics(companyId: string | null) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) { setLoading(false); return }
    fetch(companyId)
  }, [companyId])

  async function fetch(id: string) {
    setLoading(true)
    const { data } = await supabase
      .from('diagnostics')
      .select('id, vendor_name_raw, vendor_id, product_name, score_final, created_at')
      .eq('company_id', id)
      .order('created_at', { ascending: false })
    setDiagnostics((data as DiagnosticSummary[]) ?? [])
    setLoading(false)
  }

  return { diagnostics, loading, refresh: () => companyId && fetch(companyId) }
}

export function useMyDiagnostics(vendorId: string | null) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendorId) { setLoading(false); return }
    fetchOwn(vendorId)
  }, [vendorId])

  async function fetchOwn(id: string) {
    setLoading(true)
    const { data } = await supabase
      .from('diagnostics')
      .select('id, vendor_name_raw, vendor_id, product_name, score_final, created_at')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })
    setDiagnostics((data as DiagnosticSummary[]) ?? [])
    setLoading(false)
  }

  return { diagnostics, loading }
}

export function useDiagnosticDetail(diagnosticId: string | undefined) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!diagnosticId) { setLoading(false); return }
    supabase
      .from('diagnostics')
      .select('*')
      .eq('id', diagnosticId)
      .single()
      .then(({ data }) => {
        setDiagnostic(data as DiagnosticDetail)
        setLoading(false)
      })
  }, [diagnosticId])

  return { diagnostic, loading }
}
