import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import CollectibleModal, { SelectedCollectible } from '@common/components/CollectibleModal'
import CollectionCard from '@common/components/CollectionCard'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import { tokenOrCollectionSearch } from '@common/utils/search'
import { getUiType } from '@common/utils/uiType'

import CollectionsSkeleton from './CollectionsSkeleton'
import styles from './styles'

import type { TokenResult } from '@ambire-common/libs/portfolio'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  openTab: TabType
  initTab?: {
    [key: string]: boolean
  }
  networks: Network[]
  dashboardNetworkFilterName: string | null
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

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

const Collections: FC<Props> = ({
  openTab,
  initTab,
  networks,
  dashboardNetworkFilterName,
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
    selectDashboardNetworkFilter
  )
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const { t } = useTranslation()
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

    const searchableCollections = (collections || []).filter(({ chainId, collectibles, flags }) => {
      // Collections carried no flags before they could be hidden, so a result
      // from an older background has none
      if (flags?.isHidden) return false

      const isMatchingNetwork = filteredChainId === null || chainId === filteredChainId

      // A collection with no collectibles of the account has nothing to display
      return isMatchingNetwork && !!collectibles.length
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
              t("You don't have any collectibles (NFTs) on {{network}}.", {
                network: dashboardNetworkFilterName
              })}
            {searchValue &&
              (dashboardNetworkFilterName
                ? t('No collectibles (NFTs) match "{{search}}" on {{network}}.', {
                    search: searchValue,
                    network: dashboardNetworkFilterName
                  })
                : t('No collectibles (NFTs) match "{{search}}".', { search: searchValue }))}
          </Text>
        )
      }

      if (item === 'skeleton') {
        return <CollectionsSkeleton amount={filteredPortfolioCollections.length ? 3 : 5} />
      }

      if (!initTab?.collectibles || !item || item === 'keep-this-to-avoid-key-warning') return null

      const { name, address, chainId, collectibles, priceIn, flags } = item

      return (
        <CollectionCard
          key={address}
          name={name}
          address={address}
          chainId={chainId.toString()}
          collectibles={collectibles}
          priceIn={priceIn}
          openCollectibleModal={openCollectibleModal}
          networks={networks}
          isCustom={flags?.isCustom}
        />
      )
    },
    [
      initTab?.collectibles,
      openCollectibleModal,
      networks,
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

  // Rendered by the carousel above the pages, so it stays put through a swipe
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
        canHideCollectible
      />
      <DashboardPageScrollContainer
        floatingBar={floatingBar}
        tab="collectibles"
        openTab={openTab}
        data={[
          ...(initTab?.collectibles ? filteredPortfolioCollections : []),
          !filteredPortfolioCollections.length && isPortfolioAllReady ? 'empty' : '',
          !isReadyToVisualizeCollections ? 'skeleton' : 'keep-this-to-avoid-key-warning'
        ]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={isPopup ? 4 : 10}
        windowSize={15}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </>
  )
}

export default React.memo(Collections)
