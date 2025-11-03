import React, { useMemo } from 'react'
import { Image, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { FormatType } from '@ambire-common/utils/formatDecimals/formatDecimals'
import BatchIcon from '@common/assets/svg/BatchIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import Tooltip from '@common/components/Tooltip'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import spacings, { SPACING_2XL, SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getTokenId } from '@web/utils/token'

import TokenDetails from '../TokenDetails'
import PendingBadge from './PendingBadge'
import getStyles from './styles'

const rewardsImage = require('@common/assets/images/AmbireLogoLikeCoin.png')

type Props = {
  token: TokenResult
  extraActions?: React.ReactNode
  rewardsStyle?: boolean
  label?: string | React.ReactNode
  borderRadius?: number
  decimalRulesType?: FormatType
  hasBottomSpacing?: boolean
  onPress?: () => void
}

const BaseTokenItem = ({
  token,
  extraActions,
  rewardsStyle,
  label,
  borderRadius,
  decimalRulesType = 'amount',
  hasBottomSpacing = false,
  onPress
}: Props) => {
  const { portfolio } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const { t } = useTranslation()
  const { styles, theme, themeType } = useTheme(getStyles)

  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const isDark = themeType === THEME_TYPES.DARK
  const hasGradient = Boolean(rewardsStyle)
  const getColors = () => {
    if (!hasGradient) {
      return {
        from: theme.primaryBackground,
        to: isDark ? theme.tertiaryBackground : theme.secondaryBackground
      }
    }

    return {
      from: isDark ? theme.tertiaryBackground : theme.secondaryBackground,
      to: isDark ? theme.secondaryBackground : theme.tertiaryBackground
    }
  }

  const { from, to } = getColors()

  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: { from, to }
  })

  const tokenId = getTokenId(token)
  const simulatedAccountOp = portfolio.networkSimulatedAccountOp[token.chainId.toString()]

  const {
    symbol,
    address,
    chainId,
    flags: { onGasTank }
  } = token

  const {
    balanceFormatted,
    balance,
    balanceLatestFormatted,
    priceUSDFormatted,
    balanceUSDFormatted,
    networkData,
    isPending: hasPendingBadges,
    pendingBalance,
    pendingBalanceFormatted,
    pendingBalanceUSDFormatted,
    pendingToBeSigned,
    pendingToBeSignedFormatted,
    pendingToBeConfirmed,
    pendingToBeConfirmedFormatted
  } = getAndFormatTokenDetails(token, networks, simulatedAccountOp, { decimalRulesType })

  const isPending = !!hasPendingBadges

  const textColor = useMemo(() => {
    if (!isPending) return theme.primaryText
    return pendingToBeSigned ? theme.warningText : theme.info2Text
  }, [isPending, pendingToBeSigned, theme.primaryText, theme.warningText, theme.info2Text])

  return (
    <AnimatedPressable
      onPress={() => (rewardsStyle && onPress ? onPress() : openBottomSheet())}
      style={[
        styles.container,
        {
          borderRadius: borderRadius || BORDER_RADIUS_PRIMARY,
          marginBottom: hasBottomSpacing ? SPACING_TY : 0,
          ...(rewardsStyle && {
            boxShadow: `0 ${isHovered ? 2 : 3}px 0 0 ${String(theme.iconPrimary2)}`
          })
        },
        animStyle
      ]}
      {...bindAnim}
    >
      <BottomSheet
        id={`token-details-${address}`}
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      >
        <TokenDetails token={token} handleClose={closeBottomSheet} />
      </BottomSheet>

      <View style={flexboxStyles.flex1}>
        <View
          style={[
            flexboxStyles.directionRow,
            flexboxStyles.flex1,
            rewardsStyle ? flexboxStyles.alignCenter : {}
          ]}
        >
          <View style={[flexboxStyles.directionRow, { flex: 1.5 }]}>
            <View style={[spacings.mr, flexboxStyles.justifyCenter]}>
              {rewardsStyle ? (
                <View style={styles.tokenButtonIconWrapper}>
                  <Image source={rewardsImage} style={{ width: 33, height: 33 }} />
                </View>
              ) : (
                <TokenIcon
                  withContainer
                  address={address}
                  chainId={chainId}
                  onGasTank={onGasTank}
                  containerHeight={40}
                  containerWidth={40}
                  width={28}
                  height={28}
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
                <View>
                  <Text
                    selectable
                    style={spacings.mrTy}
                    color={textColor}
                    fontSize={16}
                    weight="number_bold"
                    numberOfLines={1}
                    // @ts-ignore
                    dataSet={{ tooltipId: `${tokenId}-balance` }}
                    testID={`token-balance-${tokenId}`}
                  >
                    <Text
                      weight="number_bold"
                      color={rewardsStyle ? theme.projectRewards : textColor}
                    >
                      {isPending ? pendingBalanceFormatted : balanceFormatted}
                    </Text>{' '}
                    {symbol}{' '}
                  </Text>

                  <Tooltip
                    content={String(isPending ? pendingBalance : balance)}
                    id={`${tokenId}-balance`}
                  />
                  <Text weight="regular" style={[spacings.mrMi]} fontSize={12}>
                    {!label
                      ? networkData && t('on {{network}}', { network: networkData.name })
                      : label}
                  </Text>
                </View>
                {/* area for optional actions (Claim button etc) */}
                {extraActions}
              </View>
            </View>
          </View>

          <Text
            selectable
            fontSize={16}
            color={textColor}
            weight="number_regular"
            style={{ flex: 0.7 }}
          >
            {priceUSDFormatted}
          </Text>

          <Text
            selectable
            fontSize={16}
            weight="number_bold"
            color={textColor}
            style={{ flex: 0.4, textAlign: 'right' }}
          >
            {isPending ? pendingBalanceUSDFormatted : balanceUSDFormatted}
          </Text>
        </View>

        {isPending && (
          <View style={[{ marginLeft: SPACING_2XL + SPACING_TY }, spacings.mtSm]}>
            <View>
              {!!pendingToBeSigned && !!pendingToBeSignedFormatted && (
                <PendingBadge
                  amount={pendingToBeSigned}
                  amountFormatted={pendingToBeSignedFormatted}
                  label="awaiting signature"
                  backgroundColor={theme.warningBackground}
                  textColor={theme.warningText}
                  Icon={BatchIcon}
                />
              )}
              {!!pendingToBeConfirmed && !!pendingToBeConfirmedFormatted && (
                <PendingBadge
                  amount={pendingToBeConfirmed}
                  amountFormatted={pendingToBeConfirmedFormatted}
                  label="confirming"
                  backgroundColor={theme.info2Background}
                  textColor={theme.info2Text}
                  Icon={PendingToBeConfirmedIcon}
                />
              )}
            </View>

            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
              <Text
                selectable
                style={[spacings.mrMi, { opacity: 0.7 }]}
                color={theme.successText}
                fontSize={14}
                weight="number_bold"
                numberOfLines={1}
              >
                {balanceLatestFormatted}
              </Text>
              <Text
                selectable
                style={{ opacity: 0.7 }}
                color={theme.successText}
                fontSize={12}
                numberOfLines={1}
              >
                {t('(Onchain)')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(BaseTokenItem)
