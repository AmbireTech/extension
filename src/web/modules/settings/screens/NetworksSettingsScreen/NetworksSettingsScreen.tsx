import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import AddIcon from '@common/assets/svg/AddIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import NetworkAvailableFeatures from '@web/components/NetworkAvailableFeatures'
import NetworkDetails from '@web/components/NetworkDetails'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
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
  const { networks } = useSettingsControllerState()
  const { dispatch } = useBackgroundService()
  const { addToast } = useToast()
  const search = watch('search')
  const [selectedNetworkId, setSelectedNetworkId] = useState(() => {
    const parsedSearchParams = new URLSearchParams(searchParams)

    if (parsedSearchParams.has('networkId')) {
      return parsedSearchParams.get('networkId') as string
    }

    return undefined
  })

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === selectedNetworkId),
    [networks, selectedNetworkId]
  )

  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('networks')
  }, [setCurrentSettingsPage])

  const onRemoveCustomNetwork = useCallback(
    (chainId: string | number) => {
      const network = networks.find((n) => Number(n.chainId) === Number(chainId))
      if (network) {
        // eslint-disable-next-line no-alert
        const isSure = window.confirm(
          t(
            `Are you sure you want to remove ${network.name} from networks? Upon removal, any tokens associated with this network will no longer be visible in your wallet.`
          )
        )

        if (!isSure) return

        dispatch({
          type: 'SETTINGS_CONTROLLER_REMOVE_CUSTOM_NETWORK',
          params: network.id
        })
        setSelectedNetworkId(undefined)
      } else {
        addToast(`Unable to remove network. Network with chainID: ${chainId} not found`)
      }
    },
    [networks, dispatch, addToast, t]
  )

  const filteredNetworkBySearch = networks.filter((network) =>
    network.name.toLowerCase().includes(search.toLowerCase())
  )
  const { theme } = useTheme()

  const handleSelectNetwork = (id: NetworkDescriptor['id']) => {
    setSelectedNetworkId(id)
  }

  return (
    <>
      <SettingsPageHeader title="Networks" />
      <View style={[flexbox.directionRow, flexbox.flex1]}>
        <View style={[{ flex: 1 }]}>
          <Search placeholder="Search for network" control={control} containerStyle={spacings.mb} />
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
              type="secondary"
              size="small"
              text={t('Add custom network')}
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
            maxWidthSize('xl') ? spacings.pl3Xl : spacings.plXl,
            maxWidthSize('xl') ? spacings.ml3Xl : spacings.mlXl,
            { borderLeftWidth: 1, borderColor: theme.secondaryBorder }
          ]}
        >
          <ScrollableWrapper contentContainerStyle={{ flexGrow: 1 }}>
            <View style={spacings.mbXl}>
              <NetworkDetails
                name={selectedNetwork?.name || '-'}
                iconUrl=""
                chainId={
                  selectedNetwork?.chainId ? Number(selectedNetwork.chainId).toString() : '-'
                }
                rpcUrl={selectedNetwork?.rpcUrl || '-'}
                nativeAssetSymbol={selectedNetwork?.nativeAssetSymbol || '-'}
                explorerUrl={selectedNetwork?.explorerUrl || '-'}
                handleRemoveNetwork={onRemoveCustomNetwork}
              />
            </View>
            {!!selectedNetwork && selectedNetworkId && (
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
        backgroundColor="primaryBackground"
        style={{ ...spacings.ph0, ...spacings.pv0, overflow: 'hidden' }}
      >
        <NetworkForm onSaved={closeBottomSheet} />
      </BottomSheet>
    </>
  )
}

export default React.memo(NetworksSettingsScreen)
