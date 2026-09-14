import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { STK_WALLET, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { TokenResult } from '@ambire-common/libs/portfolio'
import type { FeeExemptionReason } from '@ambire-common/libs/swapAndBridge/fee'

const selectPortfolioTokens = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.tokens

const getUsdPrice = (token?: TokenResult) =>
  token?.priceIn.find(({ baseCurrency }) => baseCurrency.toLowerCase() === 'usd')?.price

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
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const walletPrice = useMemo(() => {
    const walletToken = portfolioTokens.find(
      (token) =>
        token.chainId === ETHEREUM_CHAIN_ID &&
        token.address.toLowerCase() === WALLET_TOKEN.toLowerCase()
    )
    const stkWalletToken = portfolioTokens.find(
      (token) =>
        token.chainId === ETHEREUM_CHAIN_ID &&
        token.address.toLowerCase() === STK_WALLET.toLowerCase()
    )

    return getUsdPrice(walletToken) ?? getUsdPrice(stkWalletToken)
  }, [portfolioTokens])
  const feeTiers = useMemo(
    () => [
      {
        id: 'under-33k',
        heldLabel: t('Under 33,000'),
        minStkWalletHeld: 0,
        feePercent: 0.5,
        feeLabel: '0.50%'
      },
      {
        id: 'over-33k',
        heldLabel: t('33,000+'),
        minStkWalletHeld: 33_000,
        feePercent: 0.4,
        feeLabel: '0.40%'
      },
      {
        id: 'over-100k',
        heldLabel: t('100,000+'),
        minStkWalletHeld: 100_000,
        feePercent: 0.25,
        feeLabel: '0.25%'
      },
      {
        id: 'over-700k',
        heldLabel: t('700,000+'),
        minStkWalletHeld: 700_000,
        feePercent: 0,
        feeLabel: '0.00%'
      }
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
      isScrollEnabled={false}
      adjustToContentHeight
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
          <Text fontSize={18} weight="semiBold" style={[styles.centeredText, spacings.mtMi]}>
            {t('Stake $WALLET, pay less in trading fees')}
          </Text>
          <Text
            appearance="secondaryText"
            fontSize={12}
            style={[styles.centeredText, spacings.mtMi]}
          >
            {t('Move up through the tiers to reduce swap and bridge fees.')}
          </Text>

          <View style={spacings.mtSm}>
            {feeTiers.map((tier, index) => {
              const isCurrent = feePercent === tier.feePercent
              const isMaximum = tier.feePercent === 0
              const isBelowCurrent = tier.feePercent > feePercent
              const savingsPercent = feePercent
                ? Math.round(((feePercent - tier.feePercent) / feePercent) * 100)
                : 0
              const approximateUsdValue =
                walletPrice && tier.minStkWalletHeld
                  ? t('≈ ${{amount}}', {
                      amount: formatDecimals(tier.minStkWalletHeld * walletPrice, 'noDecimal')
                    })
                  : null

              return (
                <React.Fragment key={tier.id}>
                  <View
                    style={[
                      styles.tierCard,
                      flexbox.directionRow,
                      flexbox.alignCenter,
                      flexbox.justifySpaceBetween,
                      spacings.phSm,
                      spacings.pvTy,
                      isCurrent && styles.currentTierCard,
                      isMaximum && styles.maximumTierCard
                    ]}
                    testID={`swap-and-bridge-fee-tier-${tier.id}`}
                  >
                    <View style={[flexbox.flex1, styles.tierDetails]}>
                      {(isCurrent || isMaximum) && (
                        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}>
                          {isCurrent && (
                            <Badge
                              text={t('Your tier')}
                              type="primaryAccent"
                              style={styles.currentTierBadge}
                              textStyle={styles.featuredTierBadgeText}
                              testId="current-swap-and-bridge-fee-tier"
                            />
                          )}
                          {isMaximum && (
                            <View style={isCurrent ? spacings.mlTy : undefined}>
                              <Badge
                                text={t('Maximum benefit')}
                                type="success"
                                style={styles.maximumTierBadge}
                                textStyle={styles.featuredTierBadgeText}
                              />
                            </View>
                          )}
                        </View>
                      )}
                      <View
                        style={[
                          flexbox.directionRow,
                          flexbox.alignCenter,
                          flexbox.wrap,
                          (isCurrent || isMaximum) && spacings.mtMi
                        ]}
                      >
                        <Text fontSize={isMaximum ? 18 : 17} weight="medium">
                          {tier.heldLabel}
                        </Text>
                        {!!approximateUsdValue && (
                          <Text appearance="secondaryText" fontSize={11} style={spacings.mlTy}>
                            {approximateUsdValue}
                          </Text>
                        )}
                      </View>
                      <Text appearance="secondaryText" fontSize={12} style={spacings.mtMi}>
                        {t('$stkWALLET held')}
                      </Text>
                    </View>
                    <View style={[flexbox.alignEnd, styles.feeDetails, spacings.mlSm]}>
                      <Text
                        fontSize={isMaximum ? 28 : 18}
                        weight="medium"
                        appearance={isMaximum ? 'successText' : 'primaryText'}
                      >
                        {tier.feeLabel}
                      </Text>
                      {isCurrent && !isMaximum && (
                        <Text appearance="primary" fontSize={12} style={spacings.mtMi}>
                          {t('fee')}
                        </Text>
                      )}
                      {!isCurrent && !isMaximum && !isBelowCurrent && (
                        <Text appearance="primary" fontSize={12} style={spacings.mtMi}>
                          {t('{{percent}}% lower', { percent: savingsPercent })}
                        </Text>
                      )}
                      {isMaximum && (
                        <>
                          <Text appearance="secondaryText" fontSize={11} style={spacings.mtMi}>
                            {t('Swap & Bridge fee')}
                          </Text>
                          <Text appearance="successText" fontSize={12} style={spacings.mtMi}>
                            {t('Fee-free')}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {index === 0 && feeTiers.length > 1 && (
                    <View
                      style={[
                        flexbox.directionRow,
                        flexbox.alignCenter,
                        flexbox.justifyCenter,
                        spacings.pvMi
                      ]}
                    >
                      <DownArrowIcon
                        width={12}
                        height={7}
                        color={theme.secondaryText}
                        strokeWidth="2"
                      />
                      <Text appearance="secondaryText" fontSize={12} style={spacings.mlTy}>
                        {t('stake more, pay less')}
                      </Text>
                    </View>
                  )}
                  {index > 0 && index < feeTiers.length - 1 && <View style={spacings.mtMi} />}
                </React.Fragment>
              )
            })}
          </View>

          <Text
            appearance="secondaryText"
            fontSize={11}
            style={[styles.centeredText, spacings.mtTy]}
          >
            {t('100% of accrued fees are used for $WALLET buybacks.')}
          </Text>

          {withActions && (
            <GlassView
              borderRadius={30}
              cssStyle={{
                maxWidth: 300,
                alignSelf: 'center',
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 12,
                paddingBottom: 12
              }}
            >
              <Button
                type="secondary"
                size="smaller"
                text={t('Cancel')}
                onPress={closeBottomSheet}
                hasBottomSpacing={false}
                submitOnEnter={false}
                style={styles.cancelButton}
                textStyle={styles.actionButtonText}
                testID="swap-and-bridge-fee-info-not-now"
              />
              <Button
                size="smaller"
                text={t('Stake $WALLET')}
                onPress={handleStakePress}
                hasBottomSpacing={false}
                style={styles.stakeButton}
                textStyle={styles.actionButtonText}
                testID="swap-and-bridge-stake-wallet-button"
              />
            </GlassView>
          )}

          {withCloseAction && !withActions && (
            <View style={[flexbox.alignCenter, spacings.mtSm]}>
              <HoverablePressable
                onPress={closeBottomSheet}
                hitSlop={8}
                accessibilityRole="button"
                testID="wallet-staking-fee-info-close"
              >
                <Text appearance="primary" fontSize={14} weight="medium">
                  {t('Close')}
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
