import { Stats } from 'node:fs'
import { writeFile, stat } from 'node:fs/promises'
import prompts from 'prompts'
import isEnoent from '../../lib/is-enoent'

export default async function maybeWriteFile(
  path: string,
  content: string,
): Promise<any> {
  let stats: Stats | undefined

  try {
    stats = await stat(path)
  } catch (error) {
    if (!isEnoent(error)) {
      throw error
    }
  }

  if (stats) {
    const { confirmWriteFile } = await prompts({
      name: 'confirmWriteFile',
      type: 'confirm',
      message: `Overwrite "${path}"?`,
    })

    if (!confirmWriteFile) {
      return
    }
  }

  return writeFile(path, content)
}
