import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import ArrowRightIcon from '@common/assets/svg/ArrowRightIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapIcon from '@common/assets/svg/SwapIcon'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
import ManifestImage from '@web/components/ManifestImage'

import { DappInteraction, DisplayBalanceChange } from './types'

const dappIconAvailabilityCache = new Map<string, boolean>()

export const stylesForIcons = {
  manifestImage: {
    backgroundColor: 'transparent'
  },
  dappIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...common.borderRadiusPrimary,
    ...spacings.mrTy
  },
  balanceIconWrapper: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...common.borderRadiusPrimary
  },
  arrowDownIcon: {
    transform: [{ rotate: '90deg' }]
  }
} as const

export const BalanceChangeToken = ({ change }: { change: DisplayBalanceChange }) => {
  const { theme } = useTheme()

  if (change.iconType === 'gasTank') {
    return (
      <View style={spacings.mlTy}>
        <View style={[stylesForIcons.balanceIconWrapper, { backgroundColor: theme.neutral200 }]}>
          <GasTankIcon width={10} height={10} color={theme.tertiaryText} />
        </View>
      </View>
    )
  }

  return (
    <View style={spacings.mlTy}>
      <TokenIcon
        width={13}
        height={13}
        withContainer
        containerHeight={16}
        containerWidth={16}
        withNetworkIcon={false}
        address={change.address}
        chainId={change.chainId}
      />
    </View>
  )
}

export const DappInteractionIcon = ({ interaction }: { interaction: DappInteraction }) => {
  const { theme } = useTheme()
  const [hasIcon, setHasIcon] = useState<boolean | null>(
    interaction.iconUrl ? (dappIconAvailabilityCache.get(interaction.iconUrl) ?? null) : false
  )

  useEffect(() => {
    if (!interaction.iconUrl) {
      setHasIcon(false)
      return
    }

    const cachedAvailability = dappIconAvailabilityCache.get(interaction.iconUrl)
    if (cachedAvailability !== undefined) {
      setHasIcon(cachedAvailability)
      return
    }

    let isMounted = true

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      const iconExists = !!interaction.iconUrl && (await checkIfImageExists(interaction.iconUrl))
      dappIconAvailabilityCache.set(interaction.iconUrl!, iconExists)

      if (isMounted) setHasIcon(iconExists)
    })()

    return () => {
      isMounted = false
    }
  }, [interaction.iconUrl])

  if (interaction.iconType === 'send') {
    return (
      <View style={[stylesForIcons.dappIconWrapper, { backgroundColor: theme.neutral200 }]}>
        <SendIcon width={20} height={20} color={theme.tertiaryText} />
      </View>
    )
  }

  if (interaction.iconType === 'swap') {
    return (
      <View style={[stylesForIcons.dappIconWrapper, { backgroundColor: theme.neutral200 }]}>
        <SwapIcon width={20} height={20} color={theme.tertiaryText} />
      </View>
    )
  }

  if (interaction.iconType === 'receive') {
    return (
      <View style={[stylesForIcons.dappIconWrapper, { backgroundColor: theme.neutral200 }]}>
        <ArrowRightIcon
          width={20}
          height={20}
          color={theme.tertiaryText}
          containerColor={'transparent'}
          style={stylesForIcons.arrowDownIcon}
        />
      </View>
    )
  }

  if (!interaction.iconUrl || !hasIcon) return null

  return (
    <View style={[stylesForIcons.dappIconWrapper, { backgroundColor: theme.neutral200 }]}>
      <ManifestImage
        uri={interaction.iconUrl}
        size={20}
        isRound
        imageStyle={stylesForIcons.manifestImage}
      />
    </View>
  )
}
