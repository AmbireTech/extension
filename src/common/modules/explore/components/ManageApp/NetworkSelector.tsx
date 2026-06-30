import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import CheckIcon from '@common/assets/svg/CheckIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import Input from '@common/components/Input'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ChevronDownIcon from '@legends/common/assets/svg/ChevronDownIcon'

const NetworkOption = ({
  onSelectNetwork,
  network,
  isSelectedNetwork
}: {
  onSelectNetwork: (chainId: bigint) => void
  network: Network
  isSelectedNetwork: boolean
}) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.primaryBackground
    }
  })

  return (
    <AnimatedPressable
      {...bindAnim}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.phTy,
        spacings.pvTy,
        animStyle,
        {
          borderRadius: 8
        }
      ]}
      onPress={() => {
        onSelectNetwork(network.chainId)
      }}
    >
      <View style={flexbox.directionRow}>
        <NetworkIcon id={network.chainId.toString()} size={20} />
        <Text fontSize={14} weight="medium" style={[spacings.mlTy, spacings.mrMd]}>
          {network.name}
        </Text>
      </View>
      {isSelectedNetwork && <CheckIcon width={16} height={16} color={theme.successDecorative} />}
    </AnimatedPressable>
  )
}

const NetworkSelector = ({
  dapp,
  isAbove = false,
  isExpanded,
  setIsExpanded
}: {
  dapp: Dapp
  isAbove?: boolean
  isExpanded: boolean
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const { dispatch } = useControllersMiddleware()

  const { networks } = useController('NetworksController').state
  const { theme } = useTheme()
  const { t } = useTranslation()

  const [search, setSearch] = useState('')

  const networkData = networks.filter((n) => Number(n.chainId) === dapp.chainId)[0]

  const filteredNetworks = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return networks
    return networks.filter((n) => n.name.toLowerCase().includes(term))
  }, [networks, search])

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.primaryBackground
    }
  })

  const onSelectNetwork = useCallback(
    (chainId: bigint) => {
      dispatch({
        type: 'CHANGE_CURRENT_DAPP_NETWORK',
        params: {
          id: dapp.id,
          chainId: Number(chainId)
        }
      })
      setSearch('')
      setIsExpanded(false)
    },
    [dispatch, dapp.id, setIsExpanded, setSearch]
  )

  const networkList = (
    // I've been unable to animate the maxHeight of the container without causing
    // jittering of the other elements on Firefox.
    <ScrollView style={{ maxHeight: isExpanded ? 320 : 0 }}>
      {filteredNetworks.map((network) => (
        <NetworkOption
          onSelectNetwork={onSelectNetwork}
          key={network.chainId}
          network={network}
          isSelectedNetwork={dapp.chainId === Number(network.chainId)}
        />
      ))}
    </ScrollView>
  )

  const searchInput = isExpanded && (
    <Input
      containerStyle={spacings.mb0}
      inputWrapperStyle={{
        borderRadius: 20,
        height: 36,
        backgroundColor: theme.tertiaryBackground
      }}
      leftIcon={() => <SearchIcon color={theme.secondaryText} />}
      leftIconStyle={spacings.plSm}
      inputStyle={spacings.plTy}
      placeholder={t('Search network...')}
      value={search}
      onChangeText={setSearch}
    />
  )

  return (
    <View>
      {isAbove && networkList}
      {isAbove && searchInput}
      <AnimatedPressable
        {...bindAnim}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.phTy,
          spacings.pvTy,
          animStyle,
          { borderRadius: 8 }
        ]}
        onPress={() => {
          if (isExpanded) setSearch('')
          setIsExpanded((prev) => !prev)
        }}
      >
        <View style={flexbox.directionRow}>
          {networkData ? (
            <NetworkIcon
              id={networkData.chainId.toString()}
              size={20}
              // Force a re-render of the NetworkIcon when the chainId changes to update the icon accordingly
              key={networkData.chainId.toString()}
            />
          ) : (
            <NetworksIcon width={20} height={20} />
          )}
          <Text fontSize={14} weight="medium" style={spacings.mlTy}>
            {networkData?.name || t('Unknown Network')}
          </Text>
        </View>
        <ChevronDownIcon
          width={16}
          height={16}
          color={theme.iconPrimary}
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }]
          }}
        />
      </AnimatedPressable>
      {!isAbove && searchInput}
      {!isAbove && networkList}
    </View>
  )
}

export default NetworkSelector
