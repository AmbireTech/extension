import type { StorageProps } from '@ambire-common/interfaces/storage'

// Storage keys deliberately left out of the WebView worker's init payload.

// Before adding a key here, check the boot report's storage table.
export const BOOT_SNAPSHOT_EXCLUDED_STORAGE_KEYS: readonly (keyof StorageProps)[] = [
  'phishing',
  'dappsV2'
]
