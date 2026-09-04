import { NextResponse } from 'next/server'
import { fetchChapter } from '@/lib/bible'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const version = url.searchParams.get('version')
  const book = url.searchParams.get('book')
  const chapter = url.searchParams.get('chapter')

  if (!version || !book || !chapter) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  try {
    const data = await fetchChapter(version, book, chapter)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
