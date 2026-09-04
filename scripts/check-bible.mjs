import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal, requireEnv } from './lib/env.mjs'

loadEnvLocal()

const sb = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

for (const table of ['bible_translations', 'bible_books', 'bible_chapters', 'bible_verses']) {
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true })
  console.log(`${table}: ${error ? error.message : count}`)
}

const { data: translations } = await sb.from('bible_translations').select('slug, name, abbreviation')
console.log('translations:', translations)
