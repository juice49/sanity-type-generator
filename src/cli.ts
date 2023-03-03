import { parseArgs } from 'node:util'
import { generateTypes } from '.'
export type { FieldOptions } from './lib/field-options'

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
