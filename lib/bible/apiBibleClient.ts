const API_BASE = 'https://api.scripture.api.bible/v1'

type ApiBibleListResponse<T> = {
  data: T[]
}

type ApiBibleItemResponse<T> = {
  data: T
}

type ApiBible = {
  id: string
  abbreviation: string
  name: string
  nameLocal?: string
  language?: { id: string; name: string }
  copyrightStatement?: string
}

type ApiBibleChapter = {
  id: string
  bibleId: string
  bookId: string
  number: string
  content?: string
  reference?: string
}

function getApiKey(): string {
  const apiKey = process.env.BIBLE_API_KEY
  if (!apiKey) {
    throw new Error('BIBLE_API_KEY is not configured. Add your API.Bible key to .env.local.')
  }
  return apiKey
}

async function apiBibleFetch<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    headers: { 'api-key': getApiKey() },
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`API.Bible request failed (${response.status}): ${body || response.statusText}`)
  }

  return response.json() as Promise<T>
}

export async function listAuthorizedBibles(): Promise<ApiBible[]> {
  const result = await apiBibleFetch<ApiBibleListResponse<ApiBible>>('/bibles', { language: 'eng' })
  return result.data ?? []
}

export async function getBible(bibleId: string): Promise<ApiBible> {
  const result = await apiBibleFetch<ApiBibleItemResponse<ApiBible>>(`/bibles/${encodeURIComponent(bibleId)}`)
  return result.data
}

export async function getChapterContent(
  bibleId: string,
  chapterId: string,
): Promise<ApiBibleChapter> {
  const result = await apiBibleFetch<ApiBibleItemResponse<ApiBibleChapter>>(
    `/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}`,
    {
      'content-type': 'text',
      'include-notes': 'false',
      'include-titles': 'false',
      'include-chapter-numbers': 'false',
      'include-verse-numbers': 'true',
    },
  )
  return result.data
}

export function parseVersesFromChapterText(content: string): { verse: string; text: string }[] {
  const trimmed = content.trim()
  if (!trimmed) return []

  const tokens = trimmed.split(/(\d+[a-z]?)/)
  const verses: { verse: string; text: string }[] = []

  for (let index = 1; index < tokens.length; index += 2) {
    const verse = tokens[index]
    const text = (tokens[index + 1] ?? '').trim()
    if (verse && text) {
      verses.push({ verse, text })
    }
  }

  if (verses.length === 0) {
    return [{ verse: '1', text: trimmed }]
  }

  return verses
}
