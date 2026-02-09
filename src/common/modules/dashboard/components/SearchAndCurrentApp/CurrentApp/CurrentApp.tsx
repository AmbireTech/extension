import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import useDappsControllerState from '@web/hooks/useDappsControllerState'

const CurrentApp = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { currentDapp } = useDappsControllerState()
  const isBlacklisted = currentDapp?.blacklisted === 'BLACKLISTED'

  const dappInitials = useMemo(() => {
    const fullName = currentDapp?.name || ''

    if (!fullName) return null

    const words = fullName.split(' ').filter((word) => word.length > 0)
    const firstSymbol = words?.[0]?.[0]

    if (!firstSymbol) return null

    return firstSymbol.toUpperCase()
  }, [currentDapp?.name])

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

  if (!currentDapp) return null

  return (
    <Pressable
      style={{
        width: 40,
        height: 40,
        backgroundColor: !isBlacklisted ? theme.secondaryBackground : theme.errorBackground,
        borderRadius: 20,
        ...spacings.ml,
        ...flexbox.center
      }}
      dataSet={
        isBlacklisted
          ? createGlobalTooltipDataSet({
              id: 'blacklisted-app-tooltip',
              content: t('Blacklisted app!'),
              delayShow: 200,
              border: `1px solid ${theme.errorDecorative as string}`,
              style: {
                fontSize: 12,
                backgroundColor: theme.errorBackground as string,
                padding: SPACING_TY,
                color: theme.errorDecorative as string
              }
            })
          : {}
      }
    >
      <View>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3,
            backgroundColor: currentDapp.isConnected
              ? theme.successDecorative
              : theme.errorDecorative,
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 2,
            borderWidth: 1,
            borderColor: !isBlacklisted ? theme.neutral900 : theme.errorBackground
          }}
        />
        {currentDapp.isConnected && (
          <View
            style={{
              position: 'absolute',
              left: -2,
              bottom: -2,
              zIndex: 2
            }}
          >
            <NetworkIcon id={currentDapp.chainId.toString()} size={12} scale={0.8} />
          </View>
        )}
        <ManifestImage uri={currentDapp.icon || ''} size={24} fallback={fallbackIcon} />
      </View>
    </Pressable>
  )
}

export default CurrentApp
