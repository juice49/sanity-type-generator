import { parseArgs } from 'node:util'
import { generateTypes } from './lib/generate-types'

const force = parseArgs({
  options: {
    force: {
      type: 'boolean',
      short: 'f',
    },
  },
}).values.force

generateTypes({
  force,
})
