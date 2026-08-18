/* eslint-disable @typescript-eslint/no-require-imports */
import { Directory, File, Paths } from 'expo-file-system'

import { captureException } from '@common/config/analytics/CrashAnalytics'

// Materializes the WebView worker bundle from the OTA-shipped copy into a writable,
// app-sandboxed dir and returns the `file://` URI of its HTML entry, so the WebView can
// load the OTA'd worker via `file://` (preserving the strict CSP + SHA-384 SRI).
//
// Why: the worker bundle (the wallet's core controllers) used to ship ONLY as a native
// asset baked into the signed app, which an OTA cannot replace. We now also emit it into
// the Metro/OTA JS bundle (webview-bundle-ota.json), write it out here, and load from the
// writable copy - so OTA updates reach the worker. If anything fails, the caller falls back
// to the native-asset copy, so the worker always has a working bundle to boot.
//
// SECURITY: once the worker ships via OTA, its integrity depends on signed OTA delivery.
// This is guarded by Stallion bundle signing (StallionPublicSigningKey embedded in the native
// config + the bundle signed with --private-key at publish; see scripts/publish-ota.sh), which
// must be configured for verification to be enforced. The HTML's SRI only guards HTML<->JS
// consistency; a compromised OTA controls both, so it is defense-in-depth, not the primary guarantee.

const WEBVIEW_DIR_NAME = 'webview'
const HTML_FILE_NAME = 'webview-bundle.html'
const JS_FILE_NAME = 'webview-bundle.js'
const VERSION_FILE_NAME = 'webview-bundle.version'

// Version marker of the bundle riding this build, emitted next to (and hashed from)
// webview-bundle-ota.json by EmitOtaBundleJsonPlugin. Required separately from the
// bundle itself so the up-to-date check does not have to pull the multi-MB OTA JSON
// into memory on every launch - that require is the whole reason this check exists.
const { version: bundledVersion } = require('./webview-bundle-version.json') as { version: string }

const getPaths = () => {
  const dir = new Directory(Paths.document, WEBVIEW_DIR_NAME)

  return {
    dir,
    html: new File(dir, HTML_FILE_NAME),
    js: new File(dir, JS_FILE_NAME),
    version: new File(dir, VERSION_FILE_NAME)
  }
}

/**
 * The `file://` URI of the already-materialized worker HTML, or `null` when the copy on
 * disk is missing or stale and materializeWorkerBundle() has to run first. Synchronous
 * and cheap (three stats and a tiny read), so the WebView can mount on the first render
 * of the launch that follows any launch which materialized the current bundle.
 */
export const getMaterializedWorkerBundleUri = (): string | null => {
  try {
    const { html, js, version } = getPaths()
    if (!html.exists || !js.exists || !version.exists) return null
    if (version.textSync() !== bundledVersion) return null

    return html.uri
  } catch (error) {
    captureException(error)
    return null
  }
}

/**
 * Writes the OTA-shipped worker bundle to the app sandbox and returns the `file://` URI
 * of its HTML entry, or `null` if it could not be written (the caller then falls back to
 * the native-asset copy). Only does real work when the on-disk copy is missing or stale,
 * which is the first launch after an install or an OTA update.
 */
const materializeWorkerBundle = async (): Promise<string | null> => {
  try {
    const upToDateUri = getMaterializedWorkerBundleUri()
    if (upToDateUri) return upToDateUri

    const { dir, html, js, version } = getPaths()

    // { html, js, integrity } are emitted together by build:webview, so the HTML's SRI
    // always matches its JS. `integrity` hashes both, so an HTML-only change still
    // invalidates the on-disk copy - it is the same hash webview-bundle-version.json
    // carries as the build's version marker. Required here rather than at module scope
    // so a launch that finds an up-to-date copy never materializes the multi-MB JSON.
    const otaBundle: {
      html: string
      js: string
      integrity: string
    } = require('./webview-bundle-ota.json')

    if (!dir.exists) dir.create({ intermediates: true })

    // JS first, then the HTML that pins it, then the version marker LAST - so a crash
    // mid-write never leaves a "valid" version pointing at a partial/mismatched bundle.
    // These writes block the JS thread (the modern API has no async write), which is
    // acceptable because they only run on the first launch after an install or an OTA.
    js.write(otaBundle.js)
    html.write(otaBundle.html)
    version.write(otaBundle.integrity)

    return html.uri
  } catch (error) {
    captureException(error)
    return null
  }
}

export default materializeWorkerBundle
