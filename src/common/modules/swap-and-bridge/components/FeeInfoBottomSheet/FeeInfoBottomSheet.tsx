import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

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
  const { styles } = useTheme(getStyles)
  const feeTiers = useMemo(
    () => [
      { id: 'over-700k', heldLabel: t('700,000+'), feePercent: 0, feeLabel: '0%' },
      { id: 'over-100k', heldLabel: t('100,000+'), feePercent: 0.25, feeLabel: '0.25%' },
      { id: 'over-33k', heldLabel: t('33,000+'), feePercent: 0.4, feeLabel: '0.40%' },
      { id: 'up-to-33k', heldLabel: t('Up to 33,000'), feePercent: 0.5, feeLabel: '0.50%' }
    ],
    [t]
  )
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
        <View style={[styles.feeExemption, spacings.ph, spacings.pvSm, spacings.mtSm]}>
          <Text appearance="successText" fontSize={14} weight="semiBold">
            {t('No fee for this operation')}
          </Text>
          <Text appearance="secondaryText" fontSize={13} style={spacings.mtMi}>
            {feeExemptionExplanation}
          </Text>
        </View>
      ) : (
        <>
          <Text fontSize={20} weight="semiBold" style={[styles.centeredText, spacings.mtSm]}>
            {t('Stake $WALLET and pay less in trading fees')}
          </Text>
          <Text
            appearance="secondaryText"
            fontSize={12}
            style={[styles.centeredText, spacings.mtTy]}
          >
            {t('(100% of accrued fees are used for $WALLET buybacks)')}
          </Text>

          <View style={[styles.table, spacings.mtLg]}>
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifySpaceBetween,
                spacings.ph,
                spacings.pvTy
              ]}
            >
              <Text appearance="secondaryText" fontSize={13} weight="medium">
                {t('$stkWALLET held')}
              </Text>
              <Text appearance="secondaryText" fontSize={13} weight="medium">
                {t('Fee')}
              </Text>
            </View>

            {feeTiers.map((tier) => {
              const isCurrent = feePercent === tier.feePercent

              return (
                <View
                  key={tier.id}
                  style={[
                    styles.tierRow,
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifySpaceBetween,
                    spacings.ph,
                    spacings.pvSm,
                    isCurrent && styles.currentTierRow
                  ]}
                >
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <Text fontSize={14} weight={isCurrent ? 'semiBold' : 'medium'}>
                      {tier.heldLabel}
                    </Text>
                    {isCurrent && (
                      <Badge
                        text={t('Current')}
                        type="primaryAccent"
                        style={spacings.mlTy}
                        testId="current-swap-and-bridge-fee-tier"
                      />
                    )}
                  </View>
                  <Text fontSize={14} weight={isCurrent ? 'semiBold' : 'medium'}>
                    {tier.feeLabel}
                  </Text>
                </View>
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
          {(withActions || withCloseAction) && (
            <View style={[flexbox.alignCenter, withActions ? spacings.mtSm : spacings.mtLg]}>
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
