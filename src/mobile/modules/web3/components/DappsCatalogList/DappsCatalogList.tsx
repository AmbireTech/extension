import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import DappCatalogItemItem from '@mobile/modules/web3/components/DappsCatalogList/DappsCatalogListItem'
import useDapps from '@mobile/modules/web3/hooks/useDapps'
import useWeb3 from '@mobile/modules/web3/hooks/useWeb3'

const DappsCatalogList = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { network } = useNetwork()
  const { setSelectedDapp } = useWeb3()
  const { filteredCatalog, favorites, toggleFavorite, search } = useDapps()

  const findItemById = useCallback(
    (itemId: DappManifestData['id']) => filteredCatalog.find(({ id }) => id === itemId),
    // The sorting does not matter, so we can ignore it and watch for length only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredCatalog.length]
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

  const noSearchResults = !isLoading && !filteredCatalog.length && search
  if (noSearchResults) {
    return <Text style={[text.center, spacings.mt]}>{t('No results found.')}</Text>
  }

  return (
    <Wrapper
      hasBottomTabNav
      type={WRAPPER_TYPES.FLAT_LIST}
      style={spacings.mbTy}
      data={sortFiltered(filteredCatalog)}
      renderItem={renderItem}
      initialNumToRender={7}
      windowSize={4}
      keyExtractor={(item) => item.id}
      keyboardDismissMode="on-drag"
    />
  )
}

export default DappsCatalogList
