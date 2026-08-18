/**
 * One-shot dump of the async storage, as the raw serialized strings the storage
 * layer persists. `values` holds everything the snapshot carries; `allKeys` lists
 * every key present in storage, including the ones deliberately left out of
 * `values` (see BOOT_SNAPSHOT_EXCLUDED_STORAGE_KEYS). A key in `allKeys` but not
 * in `values` has to be read separately — it is stored, just not snapshotted.
 */
export type SerializedStorageSnapshot = {
  values: Record<string, string>
  allKeys: string[]
}
