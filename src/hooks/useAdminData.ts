import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { UserRole } from '../constants'
import type { Profile } from '../types'

export interface CompanyWithVendors {
  company: Profile
  vendors: Profile[]
}

export function useAdminData(isAdmin: boolean) {
  const [companies, setCompanies] = useState<CompanyWithVendors[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return }
    fetch()
  }, [isAdmin])

  async function fetch() {
    setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('role', [UserRole.Company, UserRole.Vendedor])
      .order('full_name')

    if (!profiles) { setLoading(false); return }

    const companyProfiles = profiles.filter(p => p.role === UserRole.Company) as Profile[]
    const vendorProfiles  = profiles.filter(p => p.role === UserRole.Vendedor) as Profile[]

    const grouped: CompanyWithVendors[] = companyProfiles.map(company => ({
      company,
      vendors: vendorProfiles.filter(v => v.company_id === company.id),
    }))

    setCompanies(grouped)
    setLoading(false)
  }

  return { companies, loading, refresh: fetch }
}
