import useStorage from '@common/hooks/useStorage'

// TODO: In the future we may want to remove assets data from local storage
// if the user logs out. For now, we'll just leave it there.
export default function useLocalCacheStorage() {
  const [assets, setAssets] = useStorage<{}>({
    key: 'assets',
    defaultValue: {}
  })
  const isInitializing = false

  const setAssetsByAccount = async (value: any) => {
    setAssets((prevState) => {
      const itemValue = typeof value === 'function' ? value(prevState) : value
      return itemValue
    })
  }

  return [assets, setAssetsByAccount, isInitializing]
}
