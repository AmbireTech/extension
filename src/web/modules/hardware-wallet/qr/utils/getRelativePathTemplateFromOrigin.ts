export function getRelativePathTemplateFromOrigin(originPath?: string) {
  if (originPath === "m/44'/60'/0'") {
    return '0/{index}'
  }

  if (originPath === "m/44'/60'/0'/0") {
    return '{index}'
  }

  return '0/{index}'
}
