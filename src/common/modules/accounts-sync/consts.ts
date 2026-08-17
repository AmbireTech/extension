/**
 * Bytes per animated QR fragment. Keeps the code at version 8 (49x49 modules) for any
 * realistic payload, while 200 bytes put it at version 11-12 (61x61 to 65x65) and 400
 * bytes at version 16-17 (81x81 to 85x85), whose modules get too small for a laptop
 * camera to tell apart reliably. The payload is gzipped, so the frame count stays low
 * despite the smaller fragments.
 */
export const ACCOUNTS_SYNC_QR_CAPACITY = 100

/**
 * How long each animated QR fragment stays on screen. The scanner is what caps the pace:
 * the web one decodes at most 8 frames per second (see `maxScansPerSecond` in QrScanner),
 * so a shorter interval is not scanned any faster - it only makes the camera more likely
 * to catch a code mid-repaint, wasting the frame entirely.
 */
export const ACCOUNTS_SYNC_QR_INTERVAL = 150

/**
 * Deriving the other device's main key from its password runs scrypt, which takes a
 * few seconds on a low end device, so the import gets a longer timeout than usual.
 */
export const ACCOUNTS_SYNC_IMPORT_TIMEOUT = 60_000

/**
 * Shown (and copied) on the mobile app, so the user can install the extension on their
 * computer and sync the accounts over to it.
 */
export const GET_AMBIRE_EXTENSION_LINK = 'ambire.com/get-extension'
