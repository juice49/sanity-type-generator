import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import { Workspace } from 'sanity'
import { readPackageUp } from 'read-pkg-up'

export default async function resolveStudioConfig(): Promise<Workspace[]> {
  const rootPkgPath = (
    await readPackageUp({ cwd: path.dirname(fileURLToPath(import.meta.url)) })
  )?.path

  if (!rootPkgPath) {
    throw new Error('Could not find root directory for `sanity` package')
  }

  return new Promise<Workspace[]>((resolve, reject) => {
    const worker = new Worker(
      path.join(
        path.dirname(rootPkgPath),
        'dist',
        'resolve-studio-config-worker.cjs',
      ),
    )

    worker.on('message', message => resolve(JSON.parse(message)))
    worker.on('error', reject)

    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}
