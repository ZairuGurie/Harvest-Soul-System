"use client";

import React, { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";

type BibleVersion = {
  slug: string;
  name: string;
  abbreviation: string;
};

export default function BibleSearch() {
  const [query, setQuery] = useState("");
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [filtered, setFiltered] = useState<BibleVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/bible/versions")
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data ?? [];
        setVersions(list);
        setFiltered(list);
      })
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(versions);
      return;
    }

    const normalized = query.toLowerCase();
    setFiltered(
      versions.filter(
        (version) =>
          version.name.toLowerCase().includes(normalized) ||
          version.abbreviation.toLowerCase().includes(normalized) ||
          version.slug.toLowerCase().includes(normalized)
      )
    );
  }, [query, versions]);

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Search bibles"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="hs-motion flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-harvest-blue/40 focus:border-harvest-blue focus:outline-none focus:ring-2 focus:ring-harvest-blue/25 dark:border-white/10 dark:bg-slate-900"
          placeholder="Search versions (KJV, NIV, NLT)"
        />
        <Button variant="ghost" onClick={() => setQuery("")}>
          Clear
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        {loading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-600">No versions match.</div>
        ) : (
          filtered.map((version) => (
            <div
              key={version.slug}
              className="hs-motion flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-harvest-cream/80 dark:hover:bg-white/5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{version.name}</div>
                <div className="text-xs text-slate-500">{version.abbreviation}</div>
              </div>
              <Button variant="outline" href={`/bible/${version.slug}`}>
                Open
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
