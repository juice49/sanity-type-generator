import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'

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

import { FieldOptions } from './field-options'
import resolveStudioConfig from './resolve-studio-config'
import indent from './indent'
import createTypeName from './create-type-name'

declare module 'sanity' {
  interface FieldDefinitionBase extends FieldOptions {}
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
export interface TypeEntry {
  workspaceName: string
  content: string
}

/**
 * @public
 */
export async function generateTypes(): Promise<TypeEntry[]> {
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
        workspaceName,
        content: output,
      }
    })

  return output
}

interface Context {
  depth: number
}

const intrinsics: Omit<
  Record<
    keyof IntrinsicDefinitions,
    string | ((type: any, context: Context) => string)
  >,
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

function createUnion(types: string[]): string {
  return [...new Set(types)].join(' | ')
}

function createNullable(type: string): string {
  return createUnion([type, 'null'])
}

function isIntrinsic(
  name?: string | SchemaType,
): name is keyof typeof intrinsics {
  return typeof name === 'string' && name in intrinsics
}

function createType(
  type: SchemaTypeDefinition | BaseSchemaType | FieldDefinition,
  depth: number = 0,
  nullable: boolean = true,
): string {
  function template(output: string): string {
    if (depth === 0) {
      let typeField = ''

      if (type.type === 'document') {
        typeField = `  _type: '${type.name}'\n`
      }

      const extension =
        type.type === 'document' ? ' extends SanityDocument' : ''

      if (['object', 'document'].includes(String(type.type))) {
        return `export interface ${createTypeName(type.name)}${extension} {\n${
          typeField + output
        }\n}\n`
      }

      return `export type ${createTypeName(type.name)} = ${output}\n`
    }

    if (output === '') {
      throw new Error('No output for: ' + type.name)
    }

    if (['object', 'document'].includes(String(type.type))) {
      const object = '{\n' + output + '\n' + indent(depth) + '}'

      if (nullable) {
        return createNullable(object)
      }

      return object
    }

    if (nullable) {
      return createNullable(output)
    }

    return output
  }

  const intrinsic = isIntrinsic(type.type) ? intrinsics[type.type] : undefined

  if (typeof intrinsic === 'function') {
    return template(
      intrinsic(type, {
        depth,
      }),
    )
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
        createType(field, depth + 1, !field.typegen?.required)
      )
    }, ''),
  )
}

function createReferenceType({
  to,
}: {
  to: (SchemaTypeDefinition | TypeReference)[]
}): string {
  const referenceType = createUnion(to.map(({ type }) => createTypeName(type)))
  return `SanityReference<${referenceType}>`
}

function createArrayType(type: ArraySchemaType, { depth }: Context): string {
  const arrayType = createUnion(
    type.of.map(
      arrayMember => `ArrayMember<${createType(arrayMember, depth, false)}>`,
    ),
  )

  const isGroup = type.of.length !== 1

  if (isGroup) {
    return `(${arrayType})[]`
  }

  return `${arrayType}[]`
}

async function loadSystemTypes(): Promise<string> {
  return await readFile(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
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
