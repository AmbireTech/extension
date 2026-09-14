import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { FeeExemptionReason } from '@ambire-common/libs/swapAndBridge/fee'
type Props = {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  feePercent: number
  feeExemptionReason?: FeeExemptionReason
  withActions?: boolean
  withCloseAction?: boolean
}

const FeeInfoBottomSheet = ({
  sheetRef,
  closeBottomSheet,
  feePercent,
  feeExemptionReason,
  withActions = true,
  withCloseAction = false
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { styles, theme } = useTheme(getStyles)
  const feeTiers = useMemo(
    () => [
      { id: 'under-33k', heldLabel: t('Under 33,000'), feePercent: 0.5, feeLabel: '0.50%' },
      { id: 'over-33k', heldLabel: t('33,000+'), feePercent: 0.4, feeLabel: '0.40%' },
      { id: 'over-100k', heldLabel: t('100,000+'), feePercent: 0.25, feeLabel: '0.25%' },
      { id: 'over-700k', heldLabel: t('700,000+'), feePercent: 0, feeLabel: '0%' }
    ],
    [t]
  )
  const visibleFeeTiers = useMemo(() => {
    const currentTierIndex = feeTiers.findIndex((tier) => tier.feePercent === feePercent)

    return currentTierIndex === -1 ? feeTiers : feeTiers.slice(currentTierIndex)
  }, [feePercent, feeTiers])
  const feeExemptionExplanation = useMemo(() => {
    if (feeExemptionReason === 'wrap-or-unwrap') {
      return t('Wrapping or unwrapping this token has no Ambire fee.')
    }
    if (feeExemptionReason === 'fee-exempt-token') {
      return t('This token is exempt from the Ambire fee.')
    }
    if (feeExemptionReason === 'fee-collection-unavailable') {
      return t('Ambire does not charge a fee for this route.')
    }

    return null
  }, [feeExemptionReason, t])

  const handleStakePress = useCallback(() => {
    closeBottomSheet()
    navigate(ROUTES.walletStaking, { state: { mode: 'stake' } })
  }, [closeBottomSheet, navigate])

  return (
    <BottomSheet
      id="swap-and-bridge-fee-info"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type="bottom-sheet"
      withBackdropBlur
    >
      {feeExemptionExplanation ? (
        <View style={[styles.feeExemption, spacings.phSm, spacings.pvSm, spacings.mtSm]}>
          <Text appearance="successText" fontSize={14} weight="semiBold">
            {t('No fee for this operation')}
          </Text>
          <Text appearance="secondaryText" fontSize={13} style={spacings.mtMi}>
            {feeExemptionExplanation}
          </Text>
        </View>
      ) : (
        <>
          <Text fontSize={24} weight="semiBold" style={spacings.mtSm}>
            {t('Stake $WALLET. Pay less.')}
          </Text>
          <Text appearance="secondaryText" fontSize={14} style={spacings.mtTy}>
            {t('Move up through the tiers to reduce swap and bridge fees.')}
          </Text>

          <View style={spacings.mtLg}>
            {visibleFeeTiers.map((tier, index) => {
              const isCurrent = feePercent === tier.feePercent
              const isMaximum = tier.feePercent === 0
              const savingsPercent = feePercent
                ? Math.round(((feePercent - tier.feePercent) / feePercent) * 100)
                : 0

              return (
                <React.Fragment key={tier.id}>
                  <View
                    style={[
                      styles.tierCard,
                      flexbox.directionRow,
                      flexbox.alignCenter,
                      flexbox.justifySpaceBetween,
                      spacings.ph,
                      isMaximum ? spacings.pvMd : spacings.pvSm,
                      isCurrent && styles.currentTierCard,
                      isMaximum && styles.maximumTierCard
                    ]}
                    testID={`swap-and-bridge-fee-tier-${tier.id}`}
                  >
                    <View style={[flexbox.flex1, styles.tierDetails]}>
                      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}>
                        <Text fontSize={isMaximum ? 24 : 20} weight="medium">
                          {tier.heldLabel}
                        </Text>
                        {isCurrent && (
                          <View style={spacings.mlTy}>
                            <Badge
                              text={t('YOUR TIER')}
                              type="primaryAccent"
                              style={styles.tierBadge}
                              textStyle={styles.tierBadgeText}
                              testId="current-swap-and-bridge-fee-tier"
                            />
                          </View>
                        )}
                      </View>
                      <Text appearance="secondaryText" fontSize={13} style={spacings.mtMi}>
                        {t('$stkWALLET held')}
                      </Text>
                      {isMaximum && (
                        <View style={[spacings.mtTy, flexbox.alignSelfStart]}>
                          <Badge
                            text={t('MAXIMUM BENEFIT')}
                            type="primaryAccent"
                            style={styles.tierBadge}
                            textStyle={styles.tierBadgeText}
                          />
                        </View>
                      )}
                    </View>
                    <View style={[flexbox.alignEnd, styles.feeDetails, spacings.mlSm]}>
                      <Text
                        fontSize={isMaximum ? 32 : 20}
                        weight="medium"
                        appearance={isMaximum ? 'successText' : 'primaryText'}
                      >
                        {tier.feeLabel}
                      </Text>

                      {!isCurrent && !isMaximum && (
                        <Text appearance="successText" fontSize={13} style={spacings.mtMi}>
                          {t('{{percent}}% lower', { percent: savingsPercent })}
                        </Text>
                      )}
                      {isMaximum && (
                        <Text appearance="successText" fontSize={14} style={spacings.mtTy}>
                          {t('Fee-free')}
                        </Text>
                      )}
                    </View>
                  </View>

                  {index === 0 && visibleFeeTiers.length > 1 && (
                    <View
                      style={[
                        flexbox.directionRow,
                        flexbox.alignCenter,
                        flexbox.justifyCenter,
                        spacings.pvSm
                      ]}
                    >
                      <DownArrowIcon
                        width={12}
                        height={7}
                        color={theme.secondaryText}
                        strokeWidth="2"
                      />
                      <Text appearance="secondaryText" fontSize={13} style={spacings.mlTy}>
                        {t('Stake more, pay less')}
                      </Text>
                    </View>
                  )}
                  {index > 0 && index < visibleFeeTiers.length - 1 && (
                    <View style={spacings.mtSm} />
                  )}
                </React.Fragment>
              )
            })}
          </View>

          {withActions && (
            <Button
              text={t('Stake $WALLET')}
              onPress={handleStakePress}
              hasBottomSpacing={false}
              style={spacings.mtLg}
              testID="swap-and-bridge-stake-wallet-button"
            />
          )}

          <Text
            appearance="secondaryText"
            fontSize={12}
            style={[styles.centeredText, withActions ? spacings.mtSm : spacings.mtLg]}
          >
            {t('100% of accrued fees are used for $WALLET buybacks.')}
          </Text>

          {(withActions || withCloseAction) && (
            <View style={[flexbox.alignCenter, spacings.mtSm]}>
              <HoverablePressable
                onPress={closeBottomSheet}
                hitSlop={8}
                accessibilityRole="button"
                testID={
                  withActions ? 'swap-and-bridge-fee-info-not-now' : 'wallet-staking-fee-info-close'
                }
              >
                <Text appearance="primary" fontSize={14} weight="medium">
                  {withActions ? t('Not now') : t('Close')}
                </Text>
              </HoverablePressable>
            </View>
          )}
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(FeeInfoBottomSheet)
