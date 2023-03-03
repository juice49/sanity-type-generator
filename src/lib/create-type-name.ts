import camelCase from 'camelcase'

export default function createTypeName(name: string): string {
  return camelCase(name, {
    pascalCase: true,
  })
}
