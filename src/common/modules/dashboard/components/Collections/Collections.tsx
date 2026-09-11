import Fuse from 'fuse.js'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Animated, FlatListProps, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import CollectibleModal, { SelectedCollectible } from '@common/components/CollectibleModal'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import { tokenOrCollectionSearch } from '@common/utils/search'
import { getUiType } from '@common/utils/uiType'

import FloatingBottomBar from '../FloatingBottomBar'
import Collection from './Collection'
import CollectionsSkeleton from './CollectionsSkeleton'
import styles from './styles'

import type { TokenResult } from '@ambire-common/libs/portfolio'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  initTab?: {
    [key: string]: boolean
  }
  sessionId: string
  onScroll?: FlatListProps<any>['onScroll']
  networks: Network[]
  dashboardNetworkFilterName: string | null
  animatedOverviewHeight: Animated.Value
  isSearchHidden?: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

const SEARCH_DEBOUNCE_MS = 200

const { isPopup } = getUiType()

const selectPortfolioCollections = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.portfolio?.collections
const selectPortfolioIsAllReady = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio?.isAllReady
const selectPortfolioIsReadyToVisualize = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.portfolio?.isReadyToVisualize

const Collections: FC<Props> = ({
  openTab,
  setOpenTab,
  initTab,
  sessionId,
  onScroll,
  networks,
  dashboardNetworkFilterName,
  animatedOverviewHeight,
  isSearchHidden,
  refreshing,
  onRefresh
}) => {
  const { state: collections } = useController(
    'SelectedAccountController',
    selectPortfolioCollections
  )
  const { state: isPortfolioAllReady } = useController(
    'SelectedAccountController',
    selectPortfolioIsAllReady
  )
  const { state: isPortfolioReadyToVisualize } = useController(
    'SelectedAccountController',
    selectPortfolioIsReadyToVisualize
  )
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    'dashboardNetworkFilter'
  )
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [selectedCollectible, setSelectedCollectible] = useState<SelectedCollectible | null>(null)
  const { control, watch, setValue } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const inputSearchValue = watch('search')
  // Debounced so a keystroke doesn't re-index every collection the account holds
  const searchValue = useDebounce({ value: inputSearchValue, delay: SEARCH_DEBOUNCE_MS })

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
    // Built once instead of per collection, since every one of them is compared to it
    const filteredChainId = dashboardNetworkFilter ? BigInt(dashboardNetworkFilter) : null

    const searchableCollections = (collections || []).filter(({ chainId, collectibles }) => {
      const isMatchingNetwork = filteredChainId === null || chainId === filteredChainId

      return isMatchingNetwork && collectibles.length
    })

    return tokenOrCollectionSearch({
      networks,
      assets: searchableCollections,
      search: searchValue,
      searchType: 'collection'
    })
  }, [collections, networks, searchValue, dashboardNetworkFilter])

  const isReadyToVisualizeCollections = useMemo(() => {
    if (isPortfolioAllReady) return true

    return isPortfolioReadyToVisualize && filteredPortfolioCollections.length
  }, [filteredPortfolioCollections.length, isPortfolioAllReady, isPortfolioReadyToVisualize])

  const renderItem = useCallback(
    ({ item }: any) => {
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch openTab={openTab} setOpenTab={setOpenTab} sessionId={sessionId} />
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
      sessionId,
      searchValue,
      dashboardNetworkFilterName,
      t,
      dashboardNetworkFilter,
      filteredPortfolioCollections.length
    ]
  )

  const keyExtractor = useCallback((collectionOrElement: TokenResult) => {
    if (typeof collectionOrElement === 'string') return collectionOrElement

    return `${collectionOrElement.address}-${collectionOrElement.chainId?.toString() || 'unknown-chain'}-${collectionOrElement.name}`
  }, [])

  useEffect(() => {
    setValue('search', '')
  }, [openTab, setValue])

  // Rendered above the carousel on mobile, so it stays put through a swipe
  const floatingBar = useMemo(
    () => ({
      control,
      networkFilterTab: 'collectibles' as const,
      searchPlaceholder: t('Search NFT')
    }),
    [control, t]
  )

  return (
    <>
      <CollectibleModal
        modalRef={modalRef}
        handleClose={closeCollectibleModal}
        selectedCollectible={selectedCollectible}
      />
      <DashboardPageScrollContainer
        floatingBar={floatingBar}
        tab="collectibles"
        openTab={openTab}
        ListHeaderComponent={isMobile ? undefined : <DashboardBanners />}
        data={[
          ...(isMobile ? [] : ['header']),
          ...(initTab?.collectibles ? filteredPortfolioCollections : []),
          !filteredPortfolioCollections.length && isPortfolioAllReady ? 'empty' : '',
          !isReadyToVisualizeCollections ? 'skeleton' : 'keep-this-to-avoid-key-warning'
        ]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={isPopup ? 4 : 10}
        windowSize={15}
        animatedOverviewHeight={animatedOverviewHeight}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      {/* The carousel renders this above the pages instead, so a swipe leaves it be */}
      {!isMobile && openTab === 'collectibles' && (
        <FloatingBottomBar {...floatingBar} isHidden={!!isSearchHidden} />
      )}
    </>
  )
}

export default React.memo(Collections)
