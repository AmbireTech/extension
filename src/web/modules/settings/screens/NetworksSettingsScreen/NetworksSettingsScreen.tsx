import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { NetworkId } from '@ambire-common/interfaces/network'
import AddIcon from '@common/assets/svg/AddIcon'
import ChainlistIcon from '@common/assets/svg/ChainlistIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import NetworkAvailableFeatures from '@web/components/NetworkAvailableFeatures'
import NetworkDetails from '@web/components/NetworkDetails'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'
import Network from '@web/modules/settings/screens/NetworksSettingsScreen/Network'
import NetworkForm from '@web/modules/settings/screens/NetworksSettingsScreen/NetworkForm'

const NetworksSettingsScreen = () => {
  const { t } = useTranslation()
  const { search: searchParams } = useRoute()
  const { control, watch } = useForm({ defaultValues: { search: '' } })
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { maxWidthSize } = useWindowSize()
  const { networks } = useNetworksControllerState()

  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { theme } = useTheme()
  const [selectedNetworkId, setSelectedNetworkId] = useState(() => {
    const parsedSearchParams = new URLSearchParams(searchParams)
    if (parsedSearchParams.has('networkId')) return parsedSearchParams.get('networkId') as string

    return undefined
  })

  const shouldOpenBottomSheet = useMemo(() => {
    const parsedSearchParams = new URLSearchParams(searchParams)

    return parsedSearchParams.has('addNetwork')
  }, [searchParams])

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === selectedNetworkId),
    [networks, selectedNetworkId]
  )

  const search = watch('search')

  useEffect(() => {
    setCurrentSettingsPage('networks')
  }, [setCurrentSettingsPage])

  const filteredNetworkBySearch = useMemo(
    () => networks.filter((network) => network.name.toLowerCase().includes(search.toLowerCase())),
    [networks, search]
  )

  const handleSelectNetwork = useCallback((id: NetworkId) => {
    setSelectedNetworkId(id)
  }, [])

  const navigateToChainlist = useCallback(async () => {
    await openInTab('https://chainlist.org/', false)
  }, [])

  return (
    <>
      <SettingsPageHeader title={t('Networks')} />
      <View style={[flexbox.directionRow, flexbox.flex1]}>
        <View style={[{ flex: 1 }]}>
          <Search
            placeholder={t('Search for network')}
            control={control}
            containerStyle={spacings.mb}
            autoFocus
          />
          <ScrollableWrapper contentContainerStyle={{ flexGrow: 1 }}>
            {filteredNetworkBySearch.length > 0 ? (
              filteredNetworkBySearch.map((network) => (
                <Network
                  key={network.id}
                  network={network}
                  selectedNetworkId={selectedNetworkId}
                  handleSelectNetwork={handleSelectNetwork}
                />
              ))
            ) : (
              <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
                <Text weight="regular" fontSize={14} style={[text.center]}>
                  {t('No networks found.')}
                </Text>
                <Text weight="regular" fontSize={14} style={[text.center]}>
                  {t('Try searching for a different network.')}
                </Text>
              </View>
            )}
          </ScrollableWrapper>
          <View style={spacings.pt}>
            <Button
              type="primary"
              size="small"
              text={t('Add network from Chainlist')}
              onPress={navigateToChainlist}
              style={{ height: 48, ...spacings.mbTy }}
              childrenPosition="left"
            >
              <ChainlistIcon width={20} height={20} color={theme.primary} style={spacings.mrTy} />
            </Button>
            <Button
              type="secondary"
              size="small"
              text={t('Add network manually')}
              onPress={openBottomSheet as any}
              hasBottomSpacing={false}
              style={{ height: 48 }}
              childrenPosition="left"
            >
              <AddIcon color={theme.primary} style={spacings.mrTy} />
            </Button>
          </View>
        </View>

        <View
          style={[
            { flex: 2 },
            maxWidthSize('xl') ? spacings.plXl : spacings.plLg,
            maxWidthSize('xl') ? spacings.mlXl : spacings.mlLg,
            { borderLeftWidth: 1, borderColor: theme.secondaryBorder }
          ]}
        >
          <ScrollableWrapper contentContainerStyle={{ flexGrow: 1 }}>
            <View style={spacings.mb}>
              <NetworkDetails
                name={selectedNetwork?.name || '-'}
                chainId={
                  selectedNetwork?.chainId ? Number(selectedNetwork.chainId).toString() : '-'
                }
                rpcUrls={selectedNetwork?.rpcUrls || ['-']}
                selectedRpcUrl={selectedNetwork?.selectedRpcUrl || '-'}
                nativeAssetSymbol={selectedNetwork?.nativeAssetSymbol || '-'}
                nativeAssetName={selectedNetwork?.nativeAssetName || '-'}
                explorerUrl={selectedNetwork?.explorerUrl || '-'}
                networkId={selectedNetworkId}
                allowRemoveNetwork
                predefined={selectedNetwork?.predefined}
              />
            </View>
            {!!selectedNetwork && !!selectedNetworkId && (
              <NetworkAvailableFeatures
                features={selectedNetwork.features}
                networkId={selectedNetworkId}
              />
            )}
          </ScrollableWrapper>
        </View>
      </View>
      <BottomSheet
        id="add-new-network"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        scrollViewProps={{
          scrollEnabled: false,
          contentContainerStyle: { flex: 1 }
        }}
        containerInnerWrapperStyles={{ flex: 1 }}
        backgroundColor="primaryBackground"
        style={{ ...spacings.ph0, ...spacings.pv0, overflow: 'hidden' }}
        autoOpen={shouldOpenBottomSheet}
      >
        <NetworkForm onCancel={closeBottomSheet} onSaved={closeBottomSheet} />
      </BottomSheet>
    </>
  )
}

export default React.memo(NetworksSettingsScreen)
