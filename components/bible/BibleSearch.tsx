"use client"

import React, { useEffect, useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'

type BibleVersion = {
  slug: string
  name: string
  abbreviation: string
}

export default function BibleSearch() {
  const [query, setQuery] = useState('')
  const [versions, setVersions] = useState<BibleVersion[]>([])
  const [filtered, setFiltered] = useState<BibleVersion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/bible/versions')
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data ?? []
        setVersions(list)
        setFiltered(list)
      })
      .catch(() => setVersions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!query) {
      setFiltered(versions)
      return
    }

    const normalized = query.toLowerCase()
    setFiltered(
      versions.filter(
        (version) =>
          version.name.toLowerCase().includes(normalized) ||
          version.abbreviation.toLowerCase().includes(normalized) ||
          version.slug.toLowerCase().includes(normalized),
      ),
    )
  }, [query, versions])

  return (
    <Card className="p-3">
      <div className="flex gap-2">
        <input
          aria-label="Search bibles"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 px-3 py-2 rounded border"
          placeholder="Search versions (KJV, NIV, NLT)"
        />
        <Button variant="ghost" onClick={() => setQuery('')}>
          Clear
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-600">No versions match.</div>
        ) : (
          filtered.map((version) => (
            <div key={version.slug} className="flex items-center justify-between">
              <div className="text-sm font-medium">{version.name}</div>
              <Button variant="outline" href={`/bible/${version.slug}`}>Open</Button>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
