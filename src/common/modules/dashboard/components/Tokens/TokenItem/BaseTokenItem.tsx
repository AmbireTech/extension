import React, { useCallback, useMemo } from 'react'
import { GestureResponderEvent, Image, View } from 'react-native'

import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { FormatType } from '@ambire-common/utils/formatDecimals/formatDecimals'
import rewardsImage from '@common/assets/images/AmbireLogoLikeCoin.png'
import BatchIcon from '@common/assets/svg/BatchIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { tooltipManager } from '@common/components/Tooltip/TooltipManager'
import XWalletConversionTooltip from '@common/components/XWalletConversionTooltip'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import { getMigrateXWalletCalls } from '@common/modules/explore/components/WalletStaking/calls'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_2XL, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'
import { getTokenId } from '@common/utils/token'
import { privateValue } from '@common/utils/ui'

import PendingBadge from './PendingBadge'
import getStyles from './styles'

import type { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'
import type { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import type { TokenResult } from '@ambire-common/libs/portfolio'
import type { WalletStateController } from '@common/controllers/wallet-state'

const selectIsPrivacyModeEnabled = (state: WalletStateController) => state.isPrivacyModeEnabled
const selectXWalletLockedShares = (state: SelectedAccountController) =>
  state.portfolio.walletStaking?.lockedShares
const selectAccountAddr = (state: SelectedAccountController) => state.account?.addr

type Props = {
  token: TokenResult
  extraActions?: React.ReactNode
  rewardsStyle?: boolean
  borderRadius?: number
  decimalRulesType?: FormatType
  hasBottomSpacing?: boolean
  onPress?: () => void
  wrapperTestID?: string
}

const BaseTokenItem = ({
  token,
  extraActions,
  rewardsStyle,
  borderRadius,
  decimalRulesType = 'amount',
  hasBottomSpacing = false,
  onPress,
  wrapperTestID
}: Props) => {
  const {
    symbol,
    address,
    chainId,
    flags: { onGasTank }
  } = token

  const selectSimulatedAccountOp = useCallback(
    (state: SelectedAccountController) =>
      state.portfolio?.networkSimulatedAccountOp?.[chainId.toString()],
    [chainId]
  )
  const { state: simulatedAccountOp } = useController(
    'SelectedAccountController',
    selectSimulatedAccountOp
  )
  const { state: isPrivacyModeEnabled } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )
  const { state: visibleUserRequests, dispatch: requestsDispatch } = useController(
    'RequestsController',
    (state) => state.visibleUserRequests
  )
  const { state: lockedShares } = useController(
    'SelectedAccountController',
    selectXWalletLockedShares
  )
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme } = useTheme(getStyles)
  const { navigate } = useNavigation()

  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
  })
  // Outlines the badge on hover, so it reads as clickable rather than as a plain label.
  // Dimming it instead would make it look disabled.
  const [bindLegacyBadgeAnim, legacyBadgeAnimStyle] = useCustomHover({
    property: 'borderColor',
    values: { from: theme.warningBackground, to: theme.warningText }
  })

  const tokenId = getTokenId(token)
  const isXWallet =
    chainId === ETHEREUM_CHAIN_ID && address.toLowerCase() === WALLET_STAKING_ADDR.toLowerCase()
  // The badge marks a balance the user can still act on (migrate to stkWALLET), so it stays
  // hidden until the locked shares are known and leave a free remainder behind. Shares already
  // committed to a pending unstake are locked in the staking contract and can't be migrated.
  const isLegacyXWallet =
    isXWallet && lockedShares !== undefined && BigInt(token.amount || 0n) > lockedShares
  // Only the free (non-locked) part of the balance can be wrapped into stkWALLET
  const migratableShares = isLegacyXWallet ? BigInt(token.amount || 0n) - (lockedShares || 0n) : 0n
  const legacyTooltipId = `dashboard-x-wallet-legacy-${tokenId}`
  const legacyDescription = t(
    '$xWALLET was the original staking token for the underlying $WALLET token. It was replaced by $stkWALLET.'
  )
  const migrateHint = isMobile ? t('Tap to migrate') : t('Click to migrate')
  // The web tooltip is plain text on hover; mobile gets the same wording with a tappable hint
  const legacyTooltipContent = `${legacyDescription} ${migrateHint}.`

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

  // Stops the press from bubbling up to the row, which would navigate to the token details.
  // Tapping the badge on mobile explains it first (there's no hover to reveal the tooltip) and
  // migrates only from the hint inside, while a click on web migrates right away.
  const handleLegacyBadgePress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation()

      if (!isMobile) {
        migrateXWallet()
        return
      }

      tooltipManager.show(
        legacyTooltipId,
        <Text fontSize={14} appearance="secondaryText">
          {`${legacyDescription} `}
          <Text fontSize={14} appearance="linkText" underline onPress={handleMigrateFromTooltip}>
            {migrateHint}
          </Text>
        </Text>
      )
    },
    [handleMigrateFromTooltip, legacyDescription, legacyTooltipId, migrateHint, migrateXWallet]
  )

  const {
    balanceFormatted,
    balance,
    balanceLatestFormatted,
    balanceUSDFormatted,
    isPending: hasPendingBadges,
    pendingBalance,
    change24h,
    change24hFormatted,
    pendingBalanceFormatted,
    pendingBalanceUSDFormatted,
    pendingToBeSigned,
    pendingToBeSignedFormatted,
    pendingToBeConfirmed,
    pendingToBeConfirmedFormatted
  } = useMemo(
    () => getAndFormatTokenDetails(token, undefined, simulatedAccountOp, { decimalRulesType }),
    [token, simulatedAccountOp, decimalRulesType]
  )

  const isPending = !!hasPendingBadges

  const openPendingRequest = useCallback(() => {
    const networkRequests = visibleUserRequests.filter(
      (r) =>
        r.kind === 'calls' &&
        r.meta.accountAddr === simulatedAccountOp?.accountAddr &&
        r.meta.chainId === simulatedAccountOp?.chainId
    ) as CallsUserRequest[]
    const pendingRequest =
      networkRequests.find((r) => r.signAccountOp.accountOp.id === simulatedAccountOp?.id) ||
      networkRequests[0]
    if (!pendingRequest) {
      addToast(
        t('Failed to open the pending transaction. If this error persists please reject it.'),
        { type: 'error' }
      )
      return
    }

    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestById',
        args: [pendingRequest.id]
      }
    })
  }, [simulatedAccountOp, visibleUserRequests, requestsDispatch, addToast, t])

  const textColor = useMemo(() => {
    if (!isPending) return theme.primaryText
    return pendingToBeSigned ? theme.warningText : theme.infoText
  }, [isPending, pendingToBeSigned, theme.primaryText, theme.warningText, theme.infoText])

  const shouldDisplayChange24h = typeof change24h === 'number' && Math.abs(change24h) >= 0.01

  const handlePress = useCallback(() => {
    if (rewardsStyle && onPress) {
      onPress()
      return
    }

    navigate(ROUTES.tokenDetails, { state: { tokenId } })
  }, [rewardsStyle, onPress, navigate, tokenId])

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        borderRadius: borderRadius || BORDER_RADIUS_PRIMARY,
        marginBottom: hasBottomSpacing ? SPACING_TY : 0,
        ...(rewardsStyle && {
          boxShadow: `0 ${isHovered ? 2 : 3}px 0 0 ${String(theme.primaryAccent)}`
        })
      },
      animStyle
    ],
    [
      styles.container,
      borderRadius,
      hasBottomSpacing,
      rewardsStyle,
      isHovered,
      theme.primaryAccent,
      animStyle
    ]
  )

  const balanceTooltipDataSet = useMemo(() => {
    if (isPrivacyModeEnabled) return undefined

    return createGlobalTooltipDataSet({
      id: `${tokenId}-balance`,
      content: String(isPending ? pendingBalance : balance)
    })
  }, [isPrivacyModeEnabled, tokenId, isPending, pendingBalance, balance])

  return (
    <AnimatedPressable
      testID={wrapperTestID || undefined}
      onPress={handlePress}
      style={containerStyle}
      {...bindAnim}
    >
      <View style={flexboxStyles.flex1}>
        <View style={[flexboxStyles.directionRow, flexboxStyles.flex1]}>
          <View style={[spacings.mrTy, flexboxStyles.justifyCenter]}>
            {rewardsStyle ? (
              <Image source={rewardsImage as any} style={{ width: 40, height: 40 }} />
            ) : (
              <TokenIcon
                withContainer
                address={address}
                chainId={chainId}
                onGasTank={onGasTank}
                containerHeight={40}
                containerWidth={40}
                width={32}
                height={32}
                networkSize={16}
              />
            )}
          </View>

          <View style={[flexboxStyles.flex1, spacings.mr]}>
            <View
              style={[
                flexboxStyles.flex1,
                flexboxStyles.directionRow,
                flexboxStyles.justifySpaceBetween,
                flexboxStyles.alignCenter
              ]}
            >
              <View style={spacings.mbMi}>
                <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
                  <Text
                    selectable
                    color={textColor}
                    fontSize={16}
                    weight="semiBold"
                    numberOfLines={1}
                    style={{ lineHeight: 22 }}
                  >
                    {symbol}
                  </Text>
                  <XWalletConversionTooltip
                    address={address}
                    chainId={chainId}
                    xWalletAmount={token.amount}
                    tooltipId={`dashboard-x-wallet-conversion-${tokenId}`}
                  />
                  {isLegacyXWallet && (
                    <AnimatedPressable
                      onPress={handleLegacyBadgePress}
                      style={[styles.legacyBadge, legacyBadgeAnimStyle]}
                      {...bindLegacyBadgeAnim}
                      dataSet={createGlobalTooltipDataSet({
                        id: legacyTooltipId,
                        content: legacyTooltipContent
                      })}
                      accessibilityLabel={legacyTooltipContent}
                      testID="dashboard-x-wallet-legacy-badge"
                    >
                      <View style={styles.legacyBadgeDot} />
                      <Text fontSize={8} weight="medium" appearance="warningText">
                        {t('LEGACY')}
                      </Text>
                    </AnimatedPressable>
                  )}
                </View>
                <Text
                  selectable
                  fontSize={12}
                  weight="number_medium"
                  numberOfLines={1}
                  dataSet={balanceTooltipDataSet}
                  appearance="secondaryText"
                  testID={`token-balance-${tokenId}`}
                >
                  {privateValue(
                    isPending ? pendingBalanceFormatted : balanceFormatted,
                    isPrivacyModeEnabled
                  )}
                </Text>
              </View>
              {/* area for optional actions (Claim button etc) */}
              {extraActions}
            </View>
          </View>
          <View style={[flexboxStyles.alignEnd, flexboxStyles.justifyCenter, spacings.mbMi]}>
            <Text
              selectable
              fontSize={16}
              weight="number_bold"
              color={textColor}
              style={{ lineHeight: 22 }}
            >
              {privateValue(
                isPending ? pendingBalanceUSDFormatted : balanceUSDFormatted,
                isPrivacyModeEnabled,
                8
              )}
            </Text>
            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
              {shouldDisplayChange24h && (
                <Text
                  fontSize={12}
                  style={spacings.mlMi}
                  weight="number_medium"
                  appearance={change24h >= 0 ? 'successText' : 'errorText'}
                >
                  {change24hFormatted}
                </Text>
              )}
            </View>
          </View>
        </View>

        {isPending && (
          <View style={[{ marginLeft: SPACING_2XL + SPACING_TY }, spacings.mtSm]}>
            <View>
              {!!pendingToBeSigned && !!pendingToBeSignedFormatted && isPending && (
                <PendingBadge
                  amount={pendingToBeSigned}
                  amountFormatted={pendingToBeSignedFormatted}
                  label="awaiting signature"
                  backgroundColor={theme.warningBackground}
                  textColor={theme.warningText}
                  Icon={BatchIcon}
                  borderColor="transparent"
                  hoverBorderColor={theme.warning400}
                  onPress={openPendingRequest}
                />
              )}

              {!!pendingToBeConfirmed && !!pendingToBeConfirmedFormatted && (
                <PendingBadge
                  amount={pendingToBeConfirmed}
                  amountFormatted={pendingToBeConfirmedFormatted}
                  label="confirming"
                  backgroundColor={theme.infoBackground}
                  textColor={theme.infoText}
                  Icon={PendingToBeConfirmedIcon}
                />
              )}
            </View>

            {!!pendingToBeSigned && !!pendingToBeSignedFormatted && isPending && (
              <View
                style={[
                  flexboxStyles.directionRow,
                  flexboxStyles.alignCenter,
                  spacings.phSm,
                  {
                    height: 30
                  }
                ]}
              >
                <Text
                  selectable
                  color={theme.successText}
                  weight="medium"
                  fontSize={12}
                  numberOfLines={1}
                >
                  {balanceLatestFormatted} {t('(Onchain)')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(BaseTokenItem)
