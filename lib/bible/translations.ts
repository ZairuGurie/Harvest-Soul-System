import type { BibleTranslation } from './types'

export const SUPPORTED_TRANSLATIONS: BibleTranslation[] = [
  {
    slug: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    apiAbbreviations: ['KJV'],
  },
  {
    slug: 'niv',
    name: 'New International Version',
    abbreviation: 'NIV',
    apiAbbreviations: ['NIV', 'NVI'],
  },
  {
    slug: 'nlt',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    apiAbbreviations: ['NLT'],
  },
]

export function getTranslationBySlug(slug: string): BibleTranslation | undefined {
  return SUPPORTED_TRANSLATIONS.find((translation) => translation.slug === slug.toLowerCase())
}

export function resolveTranslationKey(key: string): BibleTranslation | undefined {
  const normalized = key.trim().toLowerCase()
  return SUPPORTED_TRANSLATIONS.find(
    (translation) =>
      translation.slug === normalized ||
      translation.abbreviation.toLowerCase() === normalized ||
      translation.apiAbbreviations.some((abbr) => abbr.toLowerCase() === normalized),
  )
}
