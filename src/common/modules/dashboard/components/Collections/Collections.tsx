import Fuse from 'fuse.js'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Animated, FlatListProps, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import CollectibleModal, { SelectedCollectible } from '@common/components/CollectibleModal'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import { tokenOrCollectionSearch } from '@common/utils/search'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import Collection from './Collection'
import CollectionsSkeleton from './CollectionsSkeleton'
import styles from './styles'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  initTab?: {
    [key: string]: boolean
  }
  sessionId: string
  onScroll: FlatListProps<any>['onScroll']
  networks: Network[]
  dashboardNetworkFilterName: string | null
  animatedOverviewHeight: Animated.Value
}

const { isPopup } = getUiType()

const Collections: FC<Props> = ({
  openTab,
  setOpenTab,
  initTab,
  sessionId,
  onScroll,
  networks,
  dashboardNetworkFilterName,
  animatedOverviewHeight
}) => {
  const { portfolio, dashboardNetworkFilter } = useSelectedAccountControllerState()
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [selectedCollectible, setSelectedCollectible] = useState<SelectedCollectible | null>(null)
  const { control, watch, setValue } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const searchValue = watch('search')

  const closeCollectibleModal = useCallback(() => {
    closeModal()
  }, [closeModal])

  const openCollectibleModal = useCallback(
    (collectible: SelectedCollectible) => {
      setSelectedCollectible(collectible)
      openModal()
    },
    [openModal]
  )

  const filteredPortfolioCollections = useMemo(() => {
    const searchableCollections = (portfolio?.collections || []).filter(
      ({ chainId, collectibles }) => {
        let isMatchingNetwork = true
        let isMatchingSearch = true

        if (dashboardNetworkFilter) {
          isMatchingNetwork = chainId === BigInt(dashboardNetworkFilter)
        }

        return isMatchingNetwork && isMatchingSearch && collectibles.length
      }
    )

    return tokenOrCollectionSearch({
      networks,
      assets: searchableCollections,
      search: searchValue,
      searchType: 'collection'
    })
  }, [portfolio?.collections, networks, searchValue, dashboardNetworkFilter])

  const isReadyToVisualizeCollections = useMemo(() => {
    if (portfolio.isAllReady) return true

    return portfolio?.isReadyToVisualize && filteredPortfolioCollections.length
  }, [filteredPortfolioCollections.length, portfolio.isAllReady, portfolio?.isReadyToVisualize])

  const renderItem = useCallback(
    ({ item }: any) => {
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              currentTab="collectibles"
              searchControl={control}
              sessionId={sessionId}
            />
          </View>
        )
      }

      if (item === 'empty') {
        return (
          <Text
            testID="no-collectibles-text"
            fontSize={16}
            weight="medium"
            style={styles.noCollectibles}
          >
            {!searchValue &&
              !dashboardNetworkFilterName &&
              t("You don't have any collectibles (NFTs) yet.")}
            {!searchValue &&
              !!dashboardNetworkFilter &&
              t(`You don't have any collectibles (NFTs) on ${dashboardNetworkFilterName}.`)}
            {searchValue &&
              t(
                `No collectibles (NFTs) match "${searchValue}"${
                  dashboardNetworkFilterName ? ` on ${dashboardNetworkFilterName}` : ''
                }.`
              )}
          </Text>
        )
      }

      if (item === 'skeleton') {
        return <CollectionsSkeleton amount={filteredPortfolioCollections.length ? 3 : 5} />
      }

      if (!initTab?.collectibles || !item || item === 'keep-this-to-avoid-key-warning') return null

      const { name, address, chainId, collectibles, priceIn } = item

      return (
        <Collection
          key={address}
          name={name}
          address={address}
          chainId={chainId.toString()}
          collectibles={collectibles}
          priceIn={priceIn}
          openCollectibleModal={openCollectibleModal}
          networks={networks}
        />
      )
    },
    [
      initTab?.collectibles,
      openCollectibleModal,
      networks,
      theme.primaryBackground,
      openTab,
      setOpenTab,
      control,
      sessionId,
      searchValue,
      dashboardNetworkFilterName,
      t,
      dashboardNetworkFilter,
      filteredPortfolioCollections.length
    ]
  )

  const keyExtractor = useCallback((collectionOrElement: any) => {
    if (typeof collectionOrElement === 'string') return collectionOrElement

    return collectionOrElement.address
  }, [])

  useEffect(() => {
    setValue('search', '')
  }, [openTab, setValue])

  return (
    <>
      <CollectibleModal
        modalRef={modalRef}
        handleClose={closeCollectibleModal}
        selectedCollectible={selectedCollectible}
      />
      <DashboardPageScrollContainer
        tab="collectibles"
        openTab={openTab}
        onScroll={onScroll}
        ListHeaderComponent={<DashboardBanners />}
        data={[
          'header',
          ...(initTab?.collectibles ? filteredPortfolioCollections : []),
          !filteredPortfolioCollections.length && portfolio?.isAllReady ? 'empty' : '',
          !isReadyToVisualizeCollections ? 'skeleton' : 'keep-this-to-avoid-key-warning'
        ]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={isPopup ? 4 : 10}
        windowSize={15}
        bounces={false}
        animatedOverviewHeight={animatedOverviewHeight}
      />
    </>
  )
}

export default React.memo(Collections)
