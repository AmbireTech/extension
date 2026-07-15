export function normalizeOriginHdPath(path?: string) {
  if (!path) return ''
  return path.startsWith('m/') ? path : `m/${path}`
}
