/**
 * Bytes per animated QR fragment. Bigger than the default used for hardware wallet
 * signing, because a sync payload is much larger (~1.2KB per account) and would
 * otherwise loop through too many frames before the other device sees them all.
 */
export const ACCOUNTS_SYNC_QR_CAPACITY = 400

/**
 * Deriving the other device's main key from its password runs scrypt, which takes a
 * few seconds on a low end device, so the import gets a longer timeout than usual.
 */
export const ACCOUNTS_SYNC_IMPORT_TIMEOUT = 60_000
