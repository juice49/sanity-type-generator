import path from 'node:path'
import { writeFile, mkdir } from 'node:fs/promises'
import decamelize from 'decamelize'
import { TypeEntry } from '../../lib/generate-types'
import maybeWriteFile from './maybe-write-file'

/**
 * @public
 */
export type FilenameGetter = (workspaceName: string) => string

/**
 * @public
 */
export interface Options {
  destinationPath?: string
  getFilename?: FilenameGetter
  force?: boolean
}

const defaultDestinationPath = 'types'

// TODO: Handle spaces, e.g. 'my workspace name'.
const defaultGetFilename: FilenameGetter = workspaceName => {
  return decamelize(workspaceName, {
    separator: '-',
  })
}

export default async function writeTypeFiles(
  types: TypeEntry[],
  {
    destinationPath = defaultDestinationPath,
    getFilename = defaultGetFilename,
    force = false,
  }: Options = {},
) {
  await mkdir(destinationPath, {
    recursive: true,
  })

  if (force) {
    const writeFileOperations = types.map(({ workspaceName, content }) =>
      writeFile(
        getFullDestinationPath(destinationPath, getFilename, workspaceName),
        content,
      ),
    )

    await Promise.all(writeFileOperations)
    return
  }

  for (const entry of types) {
    await maybeWriteFile(
      getFullDestinationPath(destinationPath, getFilename, entry.workspaceName),
      entry?.content,
    )
  }
}

function getFullDestinationPath(
  destinationPath: string,
  getFilename: FilenameGetter,
  workspaceName: string,
): string {
  return (
    path.join(process.cwd(), destinationPath, getFilename(workspaceName)) +
    '.ts'
  )
}
