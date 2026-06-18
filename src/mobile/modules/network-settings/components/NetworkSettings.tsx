import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import NetworkAvailableFeatures from '@common/components/NetworkAvailableFeatures'
import NetworkDetails from '@common/components/NetworkDetails'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { isAmbireNext, isDev } from '@common/config/env'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import Network from '@common/modules/settings/components/Networks/Network'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import BatchingControlOption from './BatchingControlOption'

const NetworksSettings = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { search: searchParams } = useRoute()
  const { control, watch } = useForm({ defaultValues: { search: '' } })
  const {
    ref: networkDetailsSheetRef,
    open: openNetworkDetailsSheet,
    close: closeNetworkDetailsSheet
  } = useModalize()
  const { allNetworks } = useController('NetworksController').state
  const {
    state: { providers }
  } = useController('ProvidersController')

  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const [selectedChainId, setSelectedChainId] = useState(() => {
    const parsedSearchParams = new URLSearchParams(searchParams)
    if (parsedSearchParams.has('chainId'))
      return BigInt(parsedSearchParams.get('chainId') as string)

    return undefined
  })

  const selectedNetwork = useMemo(
    () => allNetworks.find((n) => n.chainId === selectedChainId),
    [allNetworks, selectedChainId]
  )

  const selectedNetworkProvider = useMemo(() => {
    if (!selectedNetwork) return undefined

    return providers[selectedNetwork.chainId.toString()]
  }, [providers, selectedNetwork])

  const search = watch('search')

  useEffect(() => {
    setCurrentSettingsPage('networks')
  }, [setCurrentSettingsPage])

  const filteredNetworkBySearch = useMemo(
    () =>
      allNetworks.filter((network) => network.name.toLowerCase().includes(search.toLowerCase())),
    [allNetworks, search]
  )

  const filteredEnabledNetworks = useMemo(
    () => filteredNetworkBySearch.filter((network) => !network.disabled),
    [filteredNetworkBySearch]
  )

  const filteredDisabledNetworks = useMemo(
    () => filteredNetworkBySearch.filter((network) => network.disabled),
    [filteredNetworkBySearch]
  )

  const handleSelectNetwork = useCallback(
    (chainId: bigint) => {
      setSelectedChainId(chainId)
      openNetworkDetailsSheet()
    },
    [openNetworkDetailsSheet]
  )

  const sections = useMemo(() => {
    const result = []

    if (filteredEnabledNetworks.length > 0)
      result.push({
        title: t('Enabled networks'),
        // The enabled section needs bottom spacing only when the disabled section follows it
        hasFooterSpacing: filteredDisabledNetworks.length > 0,
        data: filteredEnabledNetworks
      })

    if (filteredDisabledNetworks.length > 0)
      result.push({
        title: t('Disabled networks'),
        hasFooterSpacing: false,
        data: filteredDisabledNetworks
      })

    return result
  }, [filteredEnabledNetworks, filteredDisabledNetworks, t])

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredNetworkBySearch)[number] }) => (
      <Network
        network={item}
        selectedChainId={selectedChainId}
        handleSelectNetwork={handleSelectNetwork}
      />
    ),
    [selectedChainId, handleSelectNetwork]
  )

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: (typeof sections)[number] }) => (
      <Text
        weight="medium"
        fontSize={16}
        style={[{ backgroundColor: theme.primaryBackground }, spacings.mbTy]}
      >
        {title}
      </Text>
    ),
    [theme.primaryBackground]
  )

  const renderSectionFooter = useCallback(
    ({ section: { hasFooterSpacing } }: { section: (typeof sections)[number] }) =>
      hasFooterSpacing ? <View style={spacings.mb} /> : null,
    []
  )

  const keyExtractor = useCallback(
    (item: (typeof filteredNetworkBySearch)[number]) => item.chainId.toString(),
    []
  )

  const renderEmptyState = useCallback(
    () => (
      <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Text weight="regular" fontSize={14} style={[text.center]}>
          {t('No networks found.')}
        </Text>
        <Text weight="regular" fontSize={14} style={[text.center]}>
          {t('Try searching for a different network.')}
        </Text>
      </View>
    ),
    [t]
  )

  return (
    <>
      <View style={[{ flex: 1 }]}>
        <Search
          placeholder={t('Search for network')}
          control={control}
          containerStyle={spacings.mbSm}
          autoFocus
        />
        <ScrollableWrapper
          type={WRAPPER_TYPES.SECTION_LIST}
          contentContainerStyle={{ flexGrow: 1 }}
          data={sections}
          renderItem={renderItem as any}
          renderSectionHeader={renderSectionHeader as any}
          renderSectionFooter={renderSectionFooter as any}
          keyExtractor={keyExtractor as any}
          ListEmptyComponent={renderEmptyState}
          stickySectionHeadersEnabled
        />
      </View>

      <BottomSheet
        id="network-details"
        sheetRef={networkDetailsSheetRef}
        closeBottomSheet={closeNetworkDetailsSheet}
        onClosed={() => setSelectedChainId(undefined)}
      >
        <View style={spacings.mbSm}>
          <NetworkDetails
            name={selectedNetwork?.name || '-'}
            chainId={selectedNetwork?.chainId || '-'}
            rpcUrls={selectedNetwork?.rpcUrls || ['-']}
            selectedRpcUrl={selectedNetwork?.selectedRpcUrl || '-'}
            nativeAssetSymbol={selectedNetwork?.nativeAssetSymbol || '-'}
            nativeAssetName={selectedNetwork?.nativeAssetName || '-'}
            explorerUrl={selectedNetwork?.explorerUrl || '-'}
            batchMaxCount={selectedNetwork ? selectedNetworkProvider?.batchMaxCount : '-'}
            allowRemoveNetwork
          />
        </View>
        {!!selectedNetwork && !!selectedChainId && (
          <NetworkAvailableFeatures features={selectedNetwork.features} chainId={selectedChainId} />
        )}
        {(isDev || isAmbireNext) && (
          <View style={spacings.mtSm}>
            <BatchingControlOption />
          </View>
        )}
      </BottomSheet>
    </>
  )
}

export default React.memo(NetworksSettings)
