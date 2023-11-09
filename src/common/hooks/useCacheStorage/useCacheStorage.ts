import { useState } from 'react'

// TODO: In the future we may want to implement browser storage.
// In the web app we use indexedDB,
// for now here we decided to not have storage caching
export default function useLocalCacheStorage() {
  const [assets, setAssets] = useState({})
  const isInitializing = false
  const hasActiveCache = false

  const setAssetsByAccount = async (value: any) => {
    setAssets((prevState) => {
      const itemValue = typeof value === 'function' ? value(prevState) : value
      return itemValue
    })
  }

  return [assets, setAssetsByAccount, isInitializing, hasActiveCache]
}
