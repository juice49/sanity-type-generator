import { parseArgs } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import resolveStudioConfig from './lib/resolve-studio-config'
import { generateTypes } from './lib/generate-types'
import writeTypeFiles from './cli/lib/write-type-files'

const force = parseArgs({
  options: {
    force: {
      type: 'boolean',
      short: 'f',
    },
  },
}).values.force

;(async () => {
  const [workspaces, systemTypes] = await Promise.all([
    resolveStudioConfig(),
    loadSystemTypes(),
  ])

  const types = await generateTypes(workspaces, systemTypes)

  await writeTypeFiles(types, {
    force,
  })
})()

async function loadSystemTypes(): Promise<string> {
  return await readFile(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'src',
      'system-types.ts',
    ),
    {
      encoding: 'utf8',
    },
  )
}
