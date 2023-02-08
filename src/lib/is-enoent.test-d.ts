import { describe, expectTypeOf, test } from 'vitest'
import isEnoent from './is-enoent'

describe('isEnoent', () => {
  test('narrows the type if error is node `ENOENT`', () => {
    const error = new Error()

    if (isEnoent(error)) {
      expectTypeOf(error).toMatchTypeOf<{ code: 'ENOENT' }>()
    }

    if (!isEnoent(error)) {
      expectTypeOf(error).not.toMatchTypeOf<{ code: 'ENOENT' }>()
    }
  })
})
