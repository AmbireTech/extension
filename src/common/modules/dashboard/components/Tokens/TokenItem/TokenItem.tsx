import React from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import getTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import spacings, { SPACING_2XL, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

import TokenDetails from '../TokenDetails'
import getStyles from './styles'

const TokenItem = ({
  token,
  tokenPreferences,
  testID
}: {
  token: TokenResult
  tokenPreferences: CustomToken[]
  testID?: string
}) => {
  const {
    symbol,
    address,
    networkId,
    flags: { onGasTank }
  } = token
  const { t } = useTranslation()
  const { networks } = useSettingsControllerState()

  const { styles, theme } = useTheme(getStyles)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: theme.secondaryBackground
    }
  })

  const isPending =
    token.amountPostSimulation !== undefined && token.amountPostSimulation !== token.amount

  const {
    balanceFormatted,
    balance,
    pendingBalance,
    pendingBalanceFormatted,
    pendingBalanceUSDFormatted,
    priceUSDFormatted,
    balanceUSDFormatted,
    isVesting,
    networkData,
    isRewards,
    isBalanceIncrease,
    balanceChange
  } = getTokenDetails(token, networks)

  if ((isRewards || isVesting) && !balance && !pendingBalance) return null

  return (
    <AnimatedPressable
      onPress={() => openBottomSheet()}
      style={[styles.container, animStyle]}
      {...bindAnim}
      testID={testID}
    >
      <BottomSheet
        id={`token-details-${address}`}
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      >
        <TokenDetails
          tokenPreferences={tokenPreferences}
          token={token}
          handleClose={closeBottomSheet}
        />
      </BottomSheet>
      <View style={flexboxStyles.flex1}>
        <View style={[flexboxStyles.directionRow, flexboxStyles.flex1]}>
          <View style={[flexboxStyles.directionRow, { flex: 1.5 }]}>
            <View style={[spacings.mr, flexboxStyles.justifyCenter]}>
              {!!isRewards || !!isVesting ? (
                <View style={styles.tokenButtonIconWrapper}>
                  <RewardsIcon width={40} height={40} />
                </View>
              ) : (
                <TokenIcon
                  withContainer
                  address={address}
                  networkId={networkId}
                  onGasTank={onGasTank}
                  containerHeight={40}
                  containerWidth={40}
                  width={28}
                  height={28}
                />
              )}
            </View>
            <View style={flexboxStyles.flex1}>
              <Text
                selectable
                style={spacings.mrTy}
                color={isPending ? theme.warningText : theme.primaryText}
                fontSize={16}
                weight="number_bold"
                numberOfLines={1}
              >
                {isPending ? pendingBalanceFormatted : balanceFormatted} {symbol}{' '}
              </Text>

              <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
                <Text weight="regular" shouldScale={false} fontSize={12}>
                  {!!isRewards && t('rewards for claim')}
                  {!!isVesting && t('claimable early supporters vestings')}
                  {!isRewards && !isVesting && t('on')}{' '}
                </Text>
                <Text weight="regular" style={[spacings.mrMi]} fontSize={12}>
                  {!!onGasTank && t('Gas Tank')}
                  {!onGasTank && !isRewards && !isVesting && networkData?.name}
                </Text>
              </View>
            </View>
          </View>
          <Text selectable fontSize={16} weight="number_regular" style={{ flex: 0.7 }}>
            {priceUSDFormatted}
          </Text>
          <Text
            selectable
            fontSize={16}
            weight="number_bold"
            color={isPending ? theme.warningText : theme.primaryText}
            style={{ flex: 0.8, textAlign: 'right' }}
          >
            {isPending ? pendingBalanceUSDFormatted : balanceUSDFormatted}
          </Text>
        </View>
        {isPending && (
          <View style={[{ marginLeft: SPACING_2XL + SPACING_TY }, spacings.mtSm]}>
            <View
              style={[
                spacings.pvMi,
                spacings.phMi,
                spacings.mbMi,
                flexboxStyles.alignSelfStart,
                {
                  borderRadius: BORDER_RADIUS_PRIMARY,
                  borderWidth: 1,
                  borderColor: theme.warningText
                }
              ]}
            >
              <Text selectable color={theme.warningText} fontSize={14} numberOfLines={1}>
                {t(
                  `${isBalanceIncrease ? '+' : '-'}${balanceChange} Pending transaction signature`
                )}
              </Text>
            </View>

            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
              <Text
                selectable
                style={[spacings.mrMi, { opacity: 0.7 }]}
                color={theme.successText}
                fontSize={16}
                weight="number_bold"
                numberOfLines={1}
              >
                {balanceFormatted}
              </Text>
              <Text
                selectable
                style={{ opacity: 0.7 }}
                color={theme.successText}
                fontSize={14}
                numberOfLines={1}
              >
                {t('(On-chain)')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(TokenItem)
