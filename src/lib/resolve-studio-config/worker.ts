import { parentPort } from 'node:worker_threads'
import fs from 'node:fs'
import path from 'node:path'
import { firstValueFrom } from 'rxjs'
import mockBrowserEnvironment from './mock-browser-environment'
import { resolveConfig, Config } from 'sanity'

const candidates = [
  'sanity.config.js',
  'sanity.config.jsx',
  'sanity.config.ts',
  'sanity.config.tsx',
]

const basePath = process.cwd()
const cleanup = mockBrowserEnvironment(basePath)

const configPath = candidates
  .map(candidate => path.join(basePath, candidate))
  .find(candidate => fs.existsSync(candidate))

if (!configPath) {
  throw new Error(
    `Failed to resolve sanity.config.(js|ts) for base path "${basePath}"`,
  )
}

let config: Config | undefined

try {
  const mod = require(path.resolve(process.cwd(), configPath))
  config = mod.__esModule && mod.default ? mod.default : mod
} catch (error) {
  throw new Error(`Failed to load configuration file "${configPath}"`, {
    cause: error,
  })
}

;(async () => {
  if (config) {
    try {
      const workspaces = await firstValueFrom(resolveConfig(config))
      parentPort?.postMessage(JSON.stringify(workspaces))
    } catch (error) {
      throw new Error(`Resolve config failed`, {
        cause: error,
      })
    }
  }
})()
