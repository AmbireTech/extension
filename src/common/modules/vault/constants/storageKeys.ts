/**
 * Key used both in the Async and Secure Storage. In the Async storage it holds
 * the uuid of the key in the Secure Storage. In the Secure Storage, suffixed
 * with the uuid of the Async storage, it holds the password. The Secure Storage
 * key template is `${SECURE_STORE_KEY_KEYSTORE_PASSWORD}-${uuid}`
 */
export const SECURE_STORE_KEY_KEYSTORE_PASSWORD = 'keystore-password'
export const KEY_LOCK_KEYSTORE_WHEN_INACTIVE = 'shouldLockKeystoreWhenInactive'
