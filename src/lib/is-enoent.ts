export default function isEnoent(error: any): error is { code: 'ENOENT' } {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
