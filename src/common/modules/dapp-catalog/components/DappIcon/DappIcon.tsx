import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

import NotConnected from './NotConnected'

type Props = {
  dapp: Dapp
  isDashboard?: boolean
}

const DappIcon: FC<Props> = ({ dapp, isDashboard }) => {
  const { t } = useTranslation()
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

  const tooltipDataset = useMemo(() => {
    if (!isDashboard) return {}

    if (isBlacklisted) {
      return createGlobalTooltipDataSet({
        id: `dapp-${dapp.id}-blacklisted-tooltip`,
        content: t('This app is blacklisted and may be harmful. We recommend not connecting to it.')
      })
    }

    if (!dapp.isConnected) {
      return createGlobalTooltipDataSet({
        id: `dapp-${dapp.id}-not-connected-tooltip`,
        content: t('Not connected')
      })
    }

    return {}
  }, [dapp.id, dapp.isConnected, isBlacklisted, isDashboard, t])

  return (
    <View dataSet={tooltipDataset}>
      <View
        style={{
          minWidth: 8,
          minHeight: 8,
          borderRadius: 10,
          backgroundColor: !isBlacklisted ? theme.successDecorative : theme.errorDecorative,
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 2,
          borderWidth: 1,
          borderColor: !isBlacklisted ? theme.primaryBackground : theme.errorBackground
        }}
      >
        {!dapp.isConnected && (
          <NotConnected
            style={{
              minWidth: 8,
              minHeight: 8
            }}
            isBlacklisted={isBlacklisted}
          />
        )}
      </View>

      {dapp.isConnected && isDashboard && (
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
