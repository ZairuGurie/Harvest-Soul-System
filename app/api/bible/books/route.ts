import { NextResponse } from 'next/server'
import { fetchBooks } from '@/lib/bible'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const version = url.searchParams.get('version')
  if (!version) return NextResponse.json({ error: 'Missing version param' }, { status: 400 })

  try {
    const data = await fetchBooks(version)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
