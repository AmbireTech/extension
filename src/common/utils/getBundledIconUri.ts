import { isAndroid } from '@common/config/env'

/**
 * Returns the URI of an icon from the `assets` folder of the token-and-network-icons submodule.
 * Every app ships that folder outside the JS, so the icons are loaded by path: Android reads
 * `asset:/` from the APK assets (a Gradle assets dir), iOS resolves a relative path against the
 * app bundle (an Xcode folder reference) and web resolves it against the page, as the web builds
 * copy the folder next to their pages (like the other files they load, with webpack's relative
 * `publicPath`).
 */
export const getBundledIconUri = (pathInAssets: string): string => {
  if (isAndroid) return `asset:/${pathInAssets}`

  return pathInAssets
}
