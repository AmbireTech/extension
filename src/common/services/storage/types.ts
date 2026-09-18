/**
 * One-shot dump of the async storage, as the raw serialized strings the storage
 * layer persists. `values` holds only the keys asked for; `allKeys` lists every key
 * present in storage. A key in `allKeys` but not in `values` has to be read
 * separately — it is stored, just not snapshotted.
 */
export type SerializedStorageSnapshot = {
  values: Record<string, string>
  allKeys: string[]
}
