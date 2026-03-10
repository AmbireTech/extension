import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

import NotConnected from './NotConnected'

type Props = {
  dapp: Dapp
  withNetworkIcon?: boolean
}

const DappIcon: FC<Props> = ({ dapp, withNetworkIcon }) => {
  const { theme } = useTheme()
  const isBlacklisted = dapp.blacklisted === 'BLACKLISTED'

  const dappInitials = useMemo(() => {
    const fullName = dapp?.name || ''

    if (!fullName) return null

    const words = fullName.split(' ').filter((word) => word.length > 0)
    const firstSymbol = words?.[0]?.[0]

    if (!firstSymbol) return null

    return firstSymbol.toUpperCase()
  }, [dapp?.name])

  const fallbackIcon = useCallback(() => {
    if (!dappInitials) return <ManifestFallbackIcon />

    return (
      <View
        style={{
          width: 24,
          ...flexbox.center
        }}
      >
        <Text appearance={!isBlacklisted ? 'infoText' : 'errorText'}>{dappInitials}</Text>
      </View>
    )
  }, [dappInitials, isBlacklisted])

  return (
    <View>
      {dapp.isConnected ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 3,
            backgroundColor: !isBlacklisted ? theme.successDecorative : theme.errorDecorative,
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 2,
            borderWidth: 1,
            borderColor: !isBlacklisted ? theme.primaryBackground : theme.errorBackground
          }}
        />
      ) : (
        <NotConnected
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 2
          }}
          isBlacklisted={isBlacklisted}
        />
      )}
      {dapp.isConnected && withNetworkIcon && (
        <View
          style={{
            position: 'absolute',
            left: -2,
            bottom: -2,
            zIndex: 2
          }}
        >
          <NetworkIcon id={dapp.chainId.toString()} size={12} scale={0.8} />
        </View>
      )}
      <ManifestImage
        skeletonAppearance="primaryBackground"
        uri={dapp.icon || ''}
        size={24}
        fallback={fallbackIcon}
      />
    </View>
  )
}

export default DappIcon
