import { createClient } from '@supabase/supabase-js'

const envPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envPublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function assertValidUrl(url?: string, name = 'SUPABASE URL') {
  if (!url) return false
  return /^https?:\/\//i.test(url)
}

// Create a server-side client immediately (server imports expect it).
let serverSupabase: ReturnType<typeof createClient> | null = null
if (typeof window === 'undefined') {
  const supabaseUrl = envPublicUrl ?? process.env.SUPABASE_URL
  const supabaseAnonKey = envPublicKey ?? process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL/SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!assertValidUrl(supabaseUrl)) {
    throw new Error('Invalid SUPABASE_URL: Must be a valid HTTP or HTTPS URL. Check your environment variables.')
  }

  serverSupabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Export a safe `supabase` object for server usage and a safe stub for browser bundles.
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // server
    return serverSupabase as ReturnType<typeof createClient>
  }

  // In the browser, prefer public NEXT_PUBLIC_* vars. Don't throw at import time —
  // create a proxy that surfaces an explicit error if the app attempts to use Supabase without proper config.
  if (envPublicUrl && envPublicKey && assertValidUrl(envPublicUrl)) {
    return createClient(envPublicUrl, envPublicKey)
  }

  const handler: ProxyHandler<any> = {
    get() {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in runtime. Add them to your environment and restart the dev server.')
    },
  }

  return new Proxy({}, handler) as unknown as ReturnType<typeof createClient>
})()

// For server-side operations that require elevated privileges, use the
// service role key (never expose this to the browser).
export function createServerSupabase() {
  const url = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  if (!assertValidUrl(url)) {
    throw new Error('Invalid SUPABASE_URL: Must be a valid HTTP or HTTPS URL.')
  }

  return createClient(url, serviceRole)
}
