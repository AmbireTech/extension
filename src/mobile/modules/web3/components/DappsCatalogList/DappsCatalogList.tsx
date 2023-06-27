import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import React, { useCallback, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import Spinner from '@common/components/Spinner'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import DappCatalogItemItem from '@mobile/modules/web3/components/DappsCatalogList/DappsCatalogListItem'
import useDapps from '@mobile/modules/web3/hooks/useDapps'
import useWeb3 from '@mobile/modules/web3/hooks/useWeb3'

import styles from './styles'

const DappsCatalogList = () => {
  const { navigate } = useNavigation()
  const { network } = useNetwork()
  const { setSelectedDapp } = useWeb3()
  const {
    filteredCatalog,
    favorites,
    toggleFavorite,
    search,
    searchDappItem,
    searchDappUrlOrHostnameItem
  } = useDapps()

  const catalogListData = useMemo(() => {
    const data = [...filteredCatalog]
    if (search) {
      data.unshift(searchDappItem)
      !!searchDappUrlOrHostnameItem && data.unshift(searchDappUrlOrHostnameItem)
    }
    return data
  }, [filteredCatalog, search, searchDappItem, searchDappUrlOrHostnameItem])

  const findItemById = useCallback(
    (itemId: DappManifestData['id']) => catalogListData.find(({ id }) => id === itemId),
    // The sorting does not matter, so we can ignore it and watch for length only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogListData]
  )

  const handleOpenDapp = useCallback(
    async (itemId: DappManifestData['id']) => {
      const item = findItemById(itemId)
      if (!item) return

      setSelectedDapp(item)
      navigate(`${ROUTES.web3Browser}-screen`)
    },
    [findItemById, navigate, setSelectedDapp]
  )

  const handleToggleFavorite = useCallback(
    async (itemId: DappManifestData['id']) => {
      const item = findItemById(itemId)

      if (!item) return

      toggleFavorite(item)
    },
    [findItemById, toggleFavorite]
  )

  const sortFiltered = useCallback(
    (filteredItems: DappManifestData[]) => {
      return filteredItems
        .map((item) => {
          return {
            ...item,
            isSupported:
              !item.networks?.length ||
              !!item.networks?.find((networkId) => networkId === network?.id)
          }
        })
        .sort((a: any, b: any) => b.isSupported - a.isSupported)
    },
    [network]
  )

  const renderItem = ({ item }: { item: DappManifestData & { isSupported: boolean } }) => (
    <DappCatalogItemItem
      id={item.id}
      name={item.name}
      description={item.description}
      iconUrl={item.iconUrl}
      isFilled={favorites[item.url]}
      networks={item.networks}
      onOpenDapp={handleOpenDapp}
      onToggleFavorite={handleToggleFavorite}
      isSupported={item.isSupported}
      inSearchMode={!!search}
    />
  )

  const isLoading = !filteredCatalog.length && !search
  if (isLoading) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          flexbox.alignCenter,
          flexbox.justifyCenter,
          { zIndex: -1 }
        ]}
      >
        <Spinner />
      </View>
    )
  }

  const googleProps = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    sharedCookiesEnabled: true
  }

  return (
    <Wrapper
      hasBottomTabNav
      type={WRAPPER_TYPES.FLAT_LIST}
      style={styles.catalogWrapper}
      data={sortFiltered(catalogListData)}
      renderItem={renderItem}
      initialNumToRender={7}
      windowSize={4}
      keyExtractor={(item) => item.id}
      keyboardDismissMode="on-drag"
      {...googleProps}
    />
  )
}

export default DappsCatalogList
