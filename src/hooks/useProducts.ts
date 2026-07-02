import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export interface Product {
  id: string
  company_id: string
  name: string
  what_we_sell: string
  ideal_client: string
  problem_solved: string
  value_proposition: string
  price: string
  main_benefits: string[]
  common_objections: string[]
  source_pdf_name: string | null
  created_at: string
  updated_at: string
}

export function useCompanyProducts(companyId: string | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) { setLoading(false); return }
    fetch(companyId)
  }, [companyId])

  async function fetch(id: string) {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false })
    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }

  return { products, loading, refresh: () => companyId && fetch(companyId) }
}

export function useVendorProducts(profile: Profile | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.company_id) { setLoading(false); return }
    supabase
      .from('products')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name')
      .then(({ data }) => {
        setProducts((data as Product[]) ?? [])
        setLoading(false)
      })
  }, [profile?.company_id])

  return { products, loading }
}
