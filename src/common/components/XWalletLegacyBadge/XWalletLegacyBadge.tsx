import React, { useCallback } from 'react'
import { GestureResponderEvent, View } from 'react-native'

import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { tooltipManager } from '@common/components/Tooltip/TooltipManager'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { getMigrateXWalletCalls } from '@common/modules/explore/components/WalletStaking/calls'

import getStyles from './styles'

import type { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'

const selectXWalletLockedShares = (state: SelectedAccountController) =>
  state.portfolio.walletStaking?.lockedShares
const selectAccountAddr = (state: SelectedAccountController) => state.account?.addr

interface Props {
  address: string
  chainId: bigint
  xWalletAmount: bigint
  tooltipId: string
  testID?: string
}

/**
 * Marks an xWALLET balance the user can still migrate to stkWALLET, and starts that migration
 * when pressed. Renders nothing for any other token, so it can sit next to a token's symbol
 * without the surrounding screen having to know what the token is.
 */
const XWalletLegacyBadge = ({ address, chainId, xWalletAmount, tooltipId, testID }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { state: lockedShares } = useController(
    'SelectedAccountController',
    selectXWalletLockedShares
  )
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  // Outlines the badge on hover, so it reads as clickable rather than as a plain label.
  // Dimming it instead would make it look disabled.
  const [bindAnim, animStyle] = useCustomHover({
    property: 'borderColor',
    values: { from: theme.warningBackground, to: theme.warningText }
  })

  const isXWallet =
    chainId === ETHEREUM_CHAIN_ID && address.toLowerCase() === WALLET_STAKING_ADDR.toLowerCase()
  // The badge marks a balance the user can still act on (migrate to stkWALLET), so it stays
  // hidden until the locked shares are known and leave a free remainder behind. Shares already
  // committed to a pending unstake are locked in the staking contract and can't be migrated.
  const isLegacyXWallet = isXWallet && lockedShares !== undefined && xWalletAmount > lockedShares
  // Only the free (non-locked) part of the balance can be wrapped into stkWALLET
  const migratableShares = isLegacyXWallet ? xWalletAmount - (lockedShares || 0n) : 0n
  const description = t(
    '$xWALLET was the original staking token for the underlying $WALLET token. It was replaced by $stkWALLET.'
  )
  const migrateHint = isMobile ? t('Tap to migrate') : t('Click to migrate')
  // The web tooltip is plain text on hover; mobile gets the same wording with a tappable hint
  const tooltipContent = `${description} ${migrateHint}.`

  const migrateXWallet = useCallback(() => {
    if (migratableShares <= 0n || !accountAddr) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              executionType: 'open-request-window',
              userRequestParams: {
                calls: getMigrateXWalletCalls(migratableShares),
                meta: { accountAddr, chainId: ETHEREUM_CHAIN_ID }
              }
            }
          }
        ]
      }
    })
  }, [accountAddr, migratableShares, requestsDispatch])

  // Closes the info sheet first, so the migration request isn't opened behind it
  const handleMigrateFromTooltip = useCallback(() => {
    tooltipManager.hide()
    migrateXWallet()
  }, [migrateXWallet])

  // Stops the press from bubbling up to whatever the badge sits in - on the dashboard that's the
  // token row, which would navigate to the token details. Tapping the badge on mobile explains it
  // first (there's no hover to reveal the tooltip) and migrates only from the hint inside, while
  // a click on web migrates right away.
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation()

      if (!isMobile) {
        migrateXWallet()
        return
      }

      tooltipManager.show(
        tooltipId,
        <Text fontSize={14} appearance="secondaryText">
          {`${description} `}
          <Text fontSize={14} appearance="linkText" underline onPress={handleMigrateFromTooltip}>
            {migrateHint}
          </Text>
        </Text>
      )
    },
    [description, handleMigrateFromTooltip, migrateHint, migrateXWallet, tooltipId]
  )

  if (!isLegacyXWallet) return null

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.badge, animStyle]}
      {...bindAnim}
      dataSet={createGlobalTooltipDataSet({ id: tooltipId, content: tooltipContent })}
      accessibilityLabel={tooltipContent}
      testID={testID}
    >
      <View style={styles.badgeDot} />
      <Text fontSize={8} weight="medium" appearance="warningText">
        {t('LEGACY')}
      </Text>
    </AnimatedPressable>
  )
}

export default React.memo(XWalletLegacyBadge)
