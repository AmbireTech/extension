import type { Storage } from '@kohaku-eth/plugins'

const DB_NAME = 'ambire-tornado-cash'
const STORE_NAME = 'sdk-state'

const toPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

/**
 * The SDK's storage, in the extension's IndexedDB. Its value is the whole history of every pool
 * (about 200 MB of JSON on mainnet), too large for `chrome.storage` or for a message to the
 * background, so the document writes it itself. It is public data: the SDK leaves the account's
 * note secrets out and derives them again on start.
 */
export const createIdbStorage = (): Storage => {
  let dbPromise: Promise<IDBDatabase> | null = null

  const getDb = () => {
    if (!dbPromise) {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
      dbPromise = toPromise(request).catch((error) => {
        // Cleared so the next call retries, or one transient failure would poison every call
        dbPromise = null
        throw error
      })
    }

    return dbPromise
  }

  return {
    _brand: 'Storage',
    async get(key: string) {
      const db = await getDb()
      const value = await toPromise(
        db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
      )

      return typeof value === 'string' ? value : null
    },
    async set(key: string, value: string) {
      const db = await getDb()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(value, key)

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      })
    }
  }
}
