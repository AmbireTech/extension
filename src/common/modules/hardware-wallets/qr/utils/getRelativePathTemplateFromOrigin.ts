export function getRelativePathTemplateFromOrigin(originPath?: string) {
  if (originPath === "m/44'/60'/0'") {
    return '0/<account>'
  }

  if (originPath === "m/44'/60'/0'/0") {
    return '<account>'
  }

  return '0/<account>'
}
