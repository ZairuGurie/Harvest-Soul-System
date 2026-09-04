import { NextResponse } from 'next/server'
import { fetchBibles } from '@/lib/bible'

export async function GET() {
  try {
    const data = await fetchBibles()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
