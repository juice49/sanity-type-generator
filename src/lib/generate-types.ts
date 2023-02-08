import path from 'node:path'
import { Stats } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import prompts from 'prompts'

import {
  type Schema,
  Workspace,
  SchemaTypeDefinition,
  IntrinsicDefinitions,
  TypeReference,
  ArraySchemaType,
  SchemaType,
  BaseSchemaType,
  FieldDefinition,
} from 'sanity'

import camelCase from 'camelcase'
import decamelize from 'decamelize'
import resolveStudioConfig from './resolve-studio-config'
import isEnoent from './is-enoent'

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

function entryHasOriginalSchema(
  entry: [string, Schema],
): entry is [string, Schema & Required<Pick<Schema, '_original'>>] {
  const workspace = entry[1]
  return typeof workspace._original !== 'undefined'
}

/**
 * @public
 */
export default async function generateTypes({
  destinationPath = defaultDestinationPath,
  getFilename = defaultGetFilename,
  force = false,
}: Options = {}) {
  const [workspaces, systemTypes] = await Promise.all([
    resolveStudioConfig(),
    loadSystemTypes(),
  ])

  const schemasByWorkspaceName = getSchemasByWorkspaceName(workspaces)

  const output = Object.entries(schemasByWorkspaceName)
    .filter(entryHasOriginalSchema)
    .map(([workspaceName, { _original: schema }]) => {
      const output = schema.types.reduce((output, entry) => {
        return output + '\n' + createType(entry)
      }, systemTypes)

      return {
        path: getFullDestinationPath(
          destinationPath,
          getFilename,
          workspaceName,
        ),
        content: output,
      }
    })

  await mkdir(destinationPath, {
    recursive: true,
  })

  if (force) {
    const writeFileOperations = output.map(({ path, content }) =>
      writeFile(path, content),
    )

    await Promise.all(writeFileOperations)
    return
  }

  for (const entry of output) {
    await maybeWriteFile(entry?.path, entry?.content)
  }
}

function createTypeName(name: string): string {
  return camelCase(name, {
    pascalCase: true,
  })
}

const intrinsics: Omit<
  Record<keyof IntrinsicDefinitions, string | ((type: any) => string)>,
  | 'object'
  | 'document'
  // Handled by Studio.
  | 'geopoint'
  | 'slug'
> = {
  array: createArrayType,
  block: 'PortableTextBlock',
  boolean: 'boolean',
  crossDatasetReference: 'SanityCrossDatasetReference',
  date: 'string',
  datetime: 'string',
  email: 'string',
  file: 'SanityFileAsset',
  image: 'SanityImage',
  number: 'number',
  reference: createReferenceType,
  string: 'string',
  url: 'string',
  text: 'string',
}

function isIntrinsic(
  name?: string | SchemaType,
): name is keyof typeof intrinsics {
  return typeof name === 'string' && name in intrinsics
}

function createType(
  type: SchemaTypeDefinition | BaseSchemaType | FieldDefinition,
  depth: number = 0,
): string {
  function template(output: string): string {
    if (depth === 0) {
      let typeField = ''

      if (type.type === 'document') {
        typeField = `  _type: '${type.name}'\n`
      }

      const extension =
        type.type === 'document' ? ' extends SanityDocument' : ''

      if (['object', 'document'].includes(type.type)) {
        return `export interface ${createTypeName(type.name)}${extension} {\n${
          typeField + output
        }\n}\n`
      }

      return `export type ${createTypeName(type.name)} = ${output}\n`
    }

    if (output === '') {
      throw new Error('No output for: ' + type.name)
    }

    if (['object', 'document'].includes(type.type)) {
      return '{\n' + output + '\n' + indent(depth) + '}'
    }

    return output
  }

  const intrinsic = isIntrinsic(type.type) ? intrinsics[type.type] : undefined

  if (typeof intrinsic === 'function') {
    return template(intrinsic(type))
  }

  if (typeof intrinsic === 'string') {
    return template(intrinsic)
  }

  // if (type.type !== 'object' && type.type !== 'document') {
  if (!('fields' in type)) {
    if (typeof type.type !== 'string') {
      throw new Error('Type is not a string.')
    }

    return template(createTypeName(type.type))
  }

  return template(
    (type.fields ?? []).reduce((reduced, field, index) => {
      return (
        reduced +
        (index === 0 ? '' : '\n') +
        indent(depth + 1) +
        field.name +
        ': ' +
        createType(field, depth + 1)
      )
    }, ''),
  )
}

function createReferenceType({
  to,
}: {
  to: (SchemaTypeDefinition | TypeReference)[]
}): string {
  const referenceType = to.map(({ type }) => createTypeName(type)).join(' | ')
  return `SanityReference<${referenceType}>`
}

function createArrayType(type: ArraySchemaType): string {
  const arrayType = type.of
    .map(arrayMember => createType(arrayMember, 1))
    .join(' | ')

  const isGroup = type.of.length !== 1

  if (isGroup) {
    return `(${arrayType})[]`
  }

  return `${arrayType}[]`
}

function indent(depth: number): string {
  return '  '.repeat(depth)
}

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

function getSchemasByWorkspaceName(
  workspaces: Workspace[],
): Record<string, Schema> {
  return workspaces.reduce<Record<string, Schema>>(
    (schemaByWorkspaceName, { name, schema }) => ({
      ...schemaByWorkspaceName,
      [name]: schema,
    }),
    {},
  )
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

async function maybeWriteFile(path: string, content: string): Promise<any> {
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
