import indent from './indent'
import { describe, expect, test } from 'vitest'

describe('indent', () => {
  test('it returns an indent corresponding to the provided depth', () => {
    expect(indent(1)).toBe('  ')
    expect(indent(2)).toBe('    ')
  })
})
