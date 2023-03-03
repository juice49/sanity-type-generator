import { describe, expect, test } from 'vitest'
import createTypeName from './create-type-name'

describe('createTypeName', () => {
  test('it returns a pascal case version of the provided string', () => {
    expect(createTypeName('monstera deliciosa')).toBe('MonsteraDeliciosa')
  })
})
