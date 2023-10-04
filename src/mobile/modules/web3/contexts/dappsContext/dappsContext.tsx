import useDapps from 'ambire-common/src/hooks/useDapps'
import React, { createContext, useMemo } from 'react'

import useStorage from '@common/hooks/useStorage'
import isValidHostname from '@common/utils/isValidHostname'

import { DappsContextData } from './types'

const DappsContext = createContext<DappsContextData>({
  addCustomDapp: () => {},
  loadDappFromUrl: () => false,
  isDappMode: false,
  currentDappData: null,
  toggleFavorite: () => {},
  favorites: {},
  filteredCatalog: [],
  onCategorySelect: () => {},
  categoryFilter: { name: '', filter: () => false },
  search: undefined,
  onSearchChange: () => {},
  categories: [],
  loadCurrentDappData: () => {},
  searchDappUrlOrHostnameItem: null,
  searchDappItem: {} as any
})

const DappsProvider: React.FC<any> = ({ children }) => {
  const {
    addCustomDapp,
    loadDappFromUrl,
    isDappMode,
    currentDappData,
    toggleFavorite,
    favorites,
    filteredCatalog,
    onCategorySelect,
    categoryFilter,
    search,
    onSearchChange,
    categories,
    loadCurrentDappData,
    removeCustomDapp
  } = useDapps({ useStorage, fetch, applicationType: 'mobile' })

  const searchDappUrlOrHostnameItem = useMemo(() => {
    if (isValidHostname(search || '') && !/^(ftp|http|https):\/\/[^ "]+$/.test(search || '')) {
      return {
        id: `search:url-or-hostname:${search}`,
        name: `https://${search}`,
        description: '',
        url: `https://${search}`,
        iconUrl: '',
        connectionType: '' as any,
        networks: [],
        applicationType: ['mobile']
      }
    }
    if (/^(ftp|http|https):\/\/[^ "]+$/.test(search || '')) {
      return {
        id: `search:url-or-hostname:${search}`,
        name: search,
        description: '',
        url: search,
        iconUrl: '',
        connectionType: '' as any,
        networks: [],
        applicationType: ['mobile']
      }
    }

    return null
  }, [search])

  const searchDappItem = useMemo(
    () => ({
      id: `search:${search}`,
      name: `Search "${search}"`,
      description: '',
      url: `https://www.google.com/search?q=${search}&safe=active`,
      iconUrl: '',
      connectionType: '' as any,
      networks: [],
      applicationType: ['mobile']
    }),
    [search]
  )

  return (
    <DappsContext.Provider
      value={useMemo(
        () => ({
          addCustomDapp,
          loadDappFromUrl,
          isDappMode,
          currentDappData,
          toggleFavorite,
          favorites,
          filteredCatalog,
          onCategorySelect,
          categoryFilter,
          search,
          onSearchChange,
          categories,
          loadCurrentDappData,
          removeCustomDapp,
          searchDappUrlOrHostnameItem,
          searchDappItem
        }),
        [
          addCustomDapp,
          loadDappFromUrl,
          isDappMode,
          currentDappData,
          toggleFavorite,
          favorites,
          filteredCatalog,
          onCategorySelect,
          categoryFilter,
          search,
          onSearchChange,
          categories,
          loadCurrentDappData,
          removeCustomDapp,
          searchDappUrlOrHostnameItem,
          searchDappItem
        ]
      )}
    >
      {children}
    </DappsContext.Provider>
  )
}

export { DappsContext, DappsProvider }
