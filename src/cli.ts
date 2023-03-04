import { parseArgs } from 'node:util'
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
  const types = await generateTypes()

  await writeTypeFiles(types, {
    force,
  })
})()
