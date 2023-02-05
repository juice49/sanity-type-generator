import { readFile } from 'node:fs/promises'
import { describe, expect, test } from 'vitest'
import isEnoent from './is-enoent'

describe('isEnoent', () => {
  test('returns `true` if error is node `ENOENT`', async () => {
    const error = await getEnoentError()
    expect(isEnoent(error)).toBe(true)
  })

  test('returns `false` if error is not node `ENOENT`', () => {
    const error = new Error()
    expect(isEnoent(error)).toBe(false)
  })
})

async function getEnoentError() {
  try {
    await readFile('not-a-file.txt')
  } catch (error) {
    return error
  }
}
