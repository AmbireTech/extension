import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { FormatType } from '@ambire-common/utils/formatDecimals/formatDecimals'
import BatchIcon from '@common/assets/svg/BatchIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
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

type Props = {
  token: TokenResult
  extraActions?: React.ReactNode
  gradientStyle?: string
  label?: string | React.ReactNode
  borderRadius?: number
  decimalRulesType?: FormatType
  hasBottomSpacing?: boolean
}

const BaseTokenItem = ({
  token,
  extraActions,
  gradientStyle,
  label,
  borderRadius,
  decimalRulesType = 'amount',
  hasBottomSpacing = false
}: Props) => {
  const { portfolio } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const { t } = useTranslation()
  const { styles, theme, themeType } = useTheme(getStyles)

  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: themeType === THEME_TYPES.DARK ? theme.tertiaryBackground : theme.secondaryBackground
    }
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

  const gradientBorderStyle = gradientStyle
    ? {
        border: '1px solid transparent',
        borderRadius: borderRadius || BORDER_RADIUS_PRIMARY,
        padding: 1,
        background: `
        linear-gradient(${String(theme.secondaryBackground)}, ${String(
          theme.secondaryBackground
        )}) padding-box,
        ${gradientStyle} border-box
      `,
        WebkitBackgroundClip: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
        borderImageSlice: 1
      }
    : animStyle

  return (
    <AnimatedPressable
      onPress={() => openBottomSheet()}
      style={[
        styles.container,
        {
          borderRadius: borderRadius || BORDER_RADIUS_PRIMARY,
          marginBottom: hasBottomSpacing ? SPACING_TY : 0
        },
        gradientBorderStyle
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
            gradientStyle ? flexboxStyles.alignCenter : {}
          ]}
        >
          <View style={[flexboxStyles.directionRow, { flex: 1.5 }]}>
            <View style={[spacings.mr, flexboxStyles.justifyCenter]}>
              {gradientStyle ? (
                <View style={styles.tokenButtonIconWrapper}>
                  <RewardsIcon width={40} height={40} />
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
                  flexboxStyles.justifySpaceBetween
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
                    {isPending ? pendingBalanceFormatted : balanceFormatted} {symbol}{' '}
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
