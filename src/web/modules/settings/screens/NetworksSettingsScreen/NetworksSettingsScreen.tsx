import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import AddIcon from '@common/assets/svg/AddIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import { NetworkIconNameType } from '@common/components/NetworkIcon/NetworkIcon'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { IS_SCREEN_SIZE_DESKTOP_LARGE } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import SettingsPage from '@web/modules/settings/components/SettingsPage'

import NetworkForm from './NetworkForm'

const getAreDefaultsChanged = (values: any, selectedNetwork?: NetworkDescriptor) => {
  if (!selectedNetwork) {
    return false
  }

  return Object.keys(values).some((key) => {
    if (key === 'chainId') {
      return values[key] !== Number(selectedNetwork[key])
    }
    return key in selectedNetwork && values[key] !== selectedNetwork[key as keyof NetworkDescriptor]
  })
}

const NetworksSettingsScreen = () => {
  const { t } = useTranslation()
  const { control, watch } = useForm({
    defaultValues: {
      search: ''
    }
  })

  const search = watch('search')
  const { networks } = useSettingsControllerState()
  const [selectedNetworkId, setSelectedNetworkId] = useState(networks[0].id)
  const selectedNetwork = networks.find((network) => network.id === selectedNetworkId)

  const networkForm = useForm({
    // Mode onChange is required to validate the rpcUrl field, because custom errors
    // are overwritten by errors from the rules.
    mode: 'onChange',
    defaultValues: {
      name: '',
      rpcUrl: '',
      chainId: '',
      nativeAssetSymbol: '',
      explorerUrl: ''
    },
    values: {
      name: selectedNetwork?.name || '',
      rpcUrl: selectedNetwork?.rpcUrl || '',
      chainId: Number(selectedNetwork?.chainId) || '',
      nativeAssetSymbol: selectedNetwork?.nativeAssetSymbol || '',
      explorerUrl: selectedNetwork?.explorerUrl || ''
    }
  })

  const networkFormValues = networkForm.watch()

  const filteredNetworkBySearch = networks.filter((network) =>
    network.name.toLowerCase().includes(search.toLowerCase())
  )
  const { theme } = useTheme()

  const areDefaultValuesChanged = getAreDefaultsChanged(networkFormValues, selectedNetwork)

  const handleSelectNetwork = (id: string) => {
    if (areDefaultValuesChanged) {
      // Temporary solution
      const isSure = window.confirm(
        t(
          'Are you sure you want to change the network without saving? This will discard all changes.'
        )
      )

      if (!isSure) return
    }
    setSelectedNetworkId(id)
  }

  return (
    <SettingsPage currentPage="networks">
      <View
        style={[
          flexboxStyles.directionRow,
          flexboxStyles.justifySpaceBetween,
          flexboxStyles.alignCenter,
          IS_SCREEN_SIZE_DESKTOP_LARGE ? spacings.mb2Xl : spacings.mbLg
        ]}
      >
        <Text weight="medium" fontSize={20}>
          {t('Networks')}
        </Text>
        <Search placeholder="Search for a previously added network" control={control} />
      </View>
      <View style={[flexboxStyles.directionRow]}>
        <View style={flexboxStyles.flex1}>
          <View style={spacings.mbXl}>
            {filteredNetworkBySearch.length > 0 ? (
              filteredNetworkBySearch.map((network) => (
                <Pressable
                  key={network.id}
                  onPress={() => handleSelectNetwork(network.id)}
                  style={({ hovered }: any) => [
                    flexboxStyles.directionRow,
                    flexboxStyles.alignCenter,
                    spacings.pvTy,
                    spacings.phTy,
                    common.borderRadiusPrimary,
                    spacings.mbMi,
                    network.id === selectedNetworkId || hovered
                      ? { backgroundColor: theme.secondaryBackground }
                      : {}
                  ]}
                >
                  <NetworkIcon name={network.id as NetworkIconNameType} />
                  <Text fontSize={16} weight="regular" style={spacings.mlMi}>
                    {network.name}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text weight="regular" style={spacings.mlSm}>
                {t('No networks found. Try searching for a different network.')}
              </Text>
            )}
          </View>
          <Pressable
            disabled
            style={[
              flexboxStyles.directionRow,
              flexboxStyles.alignCenter,
              spacings.ml,
              { opacity: 0.6 }
            ]}
          >
            <AddIcon width={16} height={16} color={theme.primary} />
            <Text
              weight="regular"
              style={[spacings.mlSm, { textDecorationLine: 'underline' }]}
              appearance="primary"
              fontSize={16}
            >
              {t('Add New Network')}
            </Text>
          </Pressable>
        </View>
        <NetworkForm
          networkForm={networkForm}
          selectedNetwork={selectedNetwork}
          selectedNetworkId={selectedNetworkId}
        />
      </View>
    </SettingsPage>
  )
}

export default NetworksSettingsScreen
