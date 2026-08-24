import type { StorageProps } from '@ambire-common/interfaces/storage'

// Storage keys to seed the WebView worker's in-memory cache with, so a controller
// hosted there does not pay a bridge round-trip for its first read. Empty because
// the worker currently hosts no controllers.
// Before adding a key here, check the boot report's storage table.
export const BOOT_SNAPSHOT_STORAGE_KEYS: readonly (keyof StorageProps)[] = []
