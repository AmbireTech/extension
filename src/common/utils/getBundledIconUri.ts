import { isAndroid, isWeb } from '@common/config/env'

/**
 * Returns the URI of an icon from the `assets` folder of the token-and-network-icons submodule.
 * Every app ships that folder outside the JS, so the icons are loaded by path: iOS resolves a
 * relative path against the app bundle (an Xcode folder reference), Android reads `asset:/` from
 * the APK assets (a Gradle assets dir) and the web builds copy the folder to the root of their
 * output.
 */
export const getBundledIconUri = (pathInAssets: string): string => {
  if (isAndroid) return `asset:/${pathInAssets}`
  if (isWeb) return `/${pathInAssets}`

  return pathInAssets
}
