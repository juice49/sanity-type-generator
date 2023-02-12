import { parseArgs } from 'node:util'
import { generateTypes } from '.'

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
