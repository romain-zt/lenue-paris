import { describe, expect, it } from 'vitest'
import {
  assertAfterTransform,
  PUBLISHED_BLOCK_SPECS,
  VERSION_BLOCK_SPECS,
} from './helpers/blockI18nCounts'

describe('blockI18nCounts', () => {
  const heroSpec = PUBLISHED_BLOCK_SPECS[0]!

  it('defines all four published block tables', () => {
    expect(PUBLISHED_BLOCK_SPECS.map((s) => s.blockTable)).toEqual([
      'pages_blocks_hero',
      'pages_blocks_featured_products',
      'pages_blocks_editorial_strip',
      'pages_blocks_product_grid',
    ])
  })

  it('defines matching version block tables', () => {
    expect(VERSION_BLOCK_SPECS).toHaveLength(4)
    for (const spec of VERSION_BLOCK_SPECS) {
      expect(spec.versionTable).toBe(true)
      expect(spec.localeTable).toContain('_locales')
    }
  })

  it('throws when locale rows are lost during transform', () => {
    expect(() =>
      assertAfterTransform(
        heroSpec,
        { blockRows: 6, localeRows: 6, localizedFieldValues: 12 },
        { blockRows: 2, localeRows: 5, localizedFieldValues: 12 },
        2,
      ),
    ).toThrow(/locale row loss/)
  })

  it('throws when localized field values are lost during transform', () => {
    expect(() =>
      assertAfterTransform(
        heroSpec,
        { blockRows: 3, localeRows: 3, localizedFieldValues: 9 },
        { blockRows: 1, localeRows: 3, localizedFieldValues: 6 },
        1,
      ),
    ).toThrow(/localized field value loss/)
  })

  it('throws when canonical block rows are not collapsed', () => {
    expect(() =>
      assertAfterTransform(
        heroSpec,
        { blockRows: 3, localeRows: 3, localizedFieldValues: 9 },
        { blockRows: 3, localeRows: 3, localizedFieldValues: 9 },
        1,
      ),
    ).toThrow(/not collapsed/)
  })

  it('passes when locale data is preserved and blocks collapse', () => {
    expect(() =>
      assertAfterTransform(
        heroSpec,
        { blockRows: 3, localeRows: 3, localizedFieldValues: 9 },
        { blockRows: 1, localeRows: 3, localizedFieldValues: 9 },
        1,
      ),
    ).not.toThrow()
  })
})
