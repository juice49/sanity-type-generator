const INDENT_STRING = '  '

export default function indent(depth: number): string {
  return INDENT_STRING.repeat(depth)
}
