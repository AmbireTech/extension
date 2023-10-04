import { DappManifestData, UseDappsReturnType } from 'ambire-common/src/hooks/useDapps'

export type DappsContextData = {
  addCustomDapp: UseDappsReturnType['addCustomDapp']
  loadDappFromUrl: UseDappsReturnType['loadDappFromUrl']
  isDappMode: UseDappsReturnType['isDappMode']
  currentDappData: UseDappsReturnType['currentDappData']
  toggleFavorite: UseDappsReturnType['toggleFavorite']
  favorites: UseDappsReturnType['favorites']
  filteredCatalog: UseDappsReturnType['filteredCatalog']
  onCategorySelect: UseDappsReturnType['onCategorySelect']
  categoryFilter: UseDappsReturnType['categoryFilter']
  search: UseDappsReturnType['search']
  onSearchChange: UseDappsReturnType['onSearchChange']
  categories: UseDappsReturnType['categories']
  loadCurrentDappData: UseDappsReturnType['loadCurrentDappData']
  searchDappUrlOrHostnameItem: DappManifestData | null
  searchDappItem: DappManifestData
}
