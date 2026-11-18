import { isAndroid } from '@common/config/env'

/**
 * Returns the URI of an icon from `@ambire/token-and-network-icons` (a path inside its `assets`
 * folder, like `tokenIcons/1/0x….webp`). Every app ships the `tokenIcons` and `networkIcons`
 * folders outside the JS, so the icons are loaded by path: Android reads `asset:/` from the APK
 * assets (a Gradle assets dir), iOS resolves a relative path against the app bundle (Xcode folder
 * references) and web resolves it against the page, as the web builds copy the two folders next
 * to their pages (like the other files they load, with webpack's relative `publicPath`).
 */
export const getBundledIconUri = (pathInAssets: string): string => {
  if (isAndroid) return `asset:/${pathInAssets}`

  return pathInAssets
}
