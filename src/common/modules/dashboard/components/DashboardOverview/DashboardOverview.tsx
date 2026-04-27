import React, { FC, useCallback, useMemo, useState } from 'react'
import { Animated, Pressable, View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isiOS, isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import Routes from '@common/modules/dashboard/components/Routes'
import useBalanceAffectingErrors from '@common/modules/dashboard/hooks/useBalanceAffectingErrors'
import useDashboardReload from '@common/modules/dashboard/hooks/useDashboardReload'
import spacings, { SPACING, SPACING_SM, SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'
import { isExtension } from '@web/constants/browserapi'

import BalanceAffectingErrors from './BalanceAffectingErrors'
import GasTankButton from './GasTankButton'
import { OverviewBackground } from './OverviewBackground'
import RefreshIcon from './RefreshIcon'
import RewardsButton from './RewardsButton'
import getStyles from './styles'

const THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS = 10000
export const OVERVIEW_CONTENT_MAX_HEIGHT = 162

interface Props {
  openGasTankModal?: () => void
  animatedOverviewHeight: Animated.Value
  dashboardOverviewSize: {
    width: number
    height: number
  }
  setDashboardOverviewSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>
}

// We create a reusable height constant for both the Balance amount height and the Balance skeleton.
// We want both components to have the same height; otherwise, clicking on the RefreshIcon causes a layout shift.
const BALANCE_HEIGHT = 40

const DashboardOverview: FC<Props> = ({
  openGasTankModal,
  animatedOverviewHeight,
  setDashboardOverviewSize
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme(getStyles)
  const {
    state: { isOffline },
    dispatch: mainDispatch
  } = useController('MainController')
  const { account, dashboardNetworkFilter, portfolio } = useController(
    'SelectedAccountController'
  ).state
  const {
    state: { isPrivacyModeEnabled },
    dispatch: walletStateDispatch
  } = useController('WalletStateController')
  const [isBalanceHovered, setIsBalanceHovered] = useState(false)

  const {
    sheetRef,
    balanceAffectingErrorsSnapshot,
    warningMessage,
    onIconPress,
    closeBottomSheetWrapped,
    isLoadingTakingTooLong,
    networksWithErrors
  } = useBalanceAffectingErrors()
  const totalPortfolioAmount = useMemo(() => portfolio?.totalBalance || 0, [portfolio])

  // Display the button always on mobile
  const shouldShowRefreshButton = isBalanceHovered || !portfolio?.isReadyToVisualize || !isExtension

  const [totalPortfolioAmountIntegerFormattedPart, totalPortfolioAmountDecimalFormattedPart] =
    formatDecimals(totalPortfolioAmount, 'value').split('.')

  const { reloadAccount } = useDashboardReload()

  const togglePrivacyMode = useCallback(() => {
    walletStateDispatch({
      type: 'method',
      params: {
        method: 'togglePrivacyMode',
        args: []
      }
    })
  }, [walletStateDispatch])

  return (
    <View style={[spacings.phSm, spacings.mbTy]}>
      <Animated.View
        style={[
          common.borderRadiusPrimary,
          spacings.ptTy,
          isWeb && spacings.phSm,
          isMobile && spacings.phTy,
          {
            paddingBottom: isMobile
              ? SPACING_SM
              : animatedOverviewHeight.interpolate({
                  inputRange: [0, OVERVIEW_CONTENT_MAX_HEIGHT],
                  outputRange: [SPACING_TY, SPACING],
                  extrapolate: 'clamp'
                }),
            overflow: 'hidden'
          }
        ]}
        onLayout={(e) => {
          setDashboardOverviewSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height
          })
        }}
      >
        <OverviewBackground address={account?.addr || ''} />
        <View style={{ zIndex: 2 }}>
          <DashboardHeader />
          <Animated.View
            style={{
              ...flexbox.alignCenter,
              paddingTop: animatedOverviewHeight.interpolate({
                inputRange: [0, SPACING_XL],
                outputRange: [0, isMobile ? SPACING_SM : SPACING],
                extrapolate: 'clamp'
              }),
              maxHeight: animatedOverviewHeight,
              overflow: isWeb ? 'hidden' : 'visible'
            }}
          >
            {/* These width: 100%s are needed to make sure that hovering the entire row of the balance
            displays the refresh button */}
            <View style={[{ width: '100%' }, spacings.mb, flexbox.alignCenter]}>
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyCenter,
                  isWeb && spacings.mbMi,
                  isMobile && spacings.mbTy,
                  { height: BALANCE_HEIGHT, width: '100%' }
                ]}
                onMouseEnter={() => setIsBalanceHovered(true)}
                onMouseLeave={() => setIsBalanceHovered(false)}
              >
                {/* Placeholder matching the refresh button size to keep the balance centered */}
                <View
                  style={{ width: 28, height: 28, ...flexbox.justifyCenter, ...flexbox.alignEnd }}
                >
                  <BalanceAffectingErrors
                    reloadAccount={reloadAccount}
                    networksWithErrors={networksWithErrors}
                    sheetRef={sheetRef}
                    balanceAffectingErrorsSnapshot={balanceAffectingErrorsSnapshot}
                    warningMessage={warningMessage}
                    onIconPress={onIconPress}
                    closeBottomSheetWrapped={closeBottomSheetWrapped}
                    isLoadingTakingTooLong={isLoadingTakingTooLong}
                  />
                </View>
                <View style={[flexbox.alignCenter, spacings.mhTy]}>
                  {!portfolio?.isReadyToVisualize ? (
                    <SkeletonLoader
                      lowOpacity
                      width={180}
                      height={BALANCE_HEIGHT}
                      borderRadius={8}
                    />
                  ) : (
                    <Pressable
                      testID="full-balance"
                      onPress={togglePrivacyMode}
                      style={[flexbox.directionRow, flexbox.alignEnd]}
                    >
                      <Text
                        fontSize={34}
                        shouldScale={false}
                        weight="number_bold"
                        // Line height should be constant based on font size, not on parent height
                        style={!isWeb ? { lineHeight: 36 } : { lineHeight: 28 }}
                        color={
                          networksWithErrors.length || isOffline
                            ? theme.warningDecorative2
                            : '#FFFFFF'
                        }
                        testID="total-portfolio-amount-integer"
                      >
                        {privateValue(
                          totalPortfolioAmountIntegerFormattedPart,
                          isPrivacyModeEnabled,
                          7
                        )}
                      </Text>
                      {totalPortfolioAmount < THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS &&
                        !isPrivacyModeEnabled && (
                          <Text
                            fontSize={20}
                            shouldScale={false}
                            weight="number_bold"
                            color={
                              networksWithErrors.length || isOffline
                                ? theme.warningDecorative2
                                : '#FFFFFF'
                            }
                            style={!isWeb ? { lineHeight: isiOS ? 30 : 28 } : { lineHeight: 20 }}
                          >
                            {t('.')}
                            {totalPortfolioAmountDecimalFormattedPart}
                          </Text>
                        )}
                    </Pressable>
                  )}
                </View>
                {
                  isWeb ? (
                    <Pressable
                      style={({ hovered }: any) => ({
                        width: 28,
                        height: 28,
                        opacity: shouldShowRefreshButton ? (hovered ? 1 : 0.7) : 0
                      })}
                      onPress={reloadAccount}
                      disabled={!portfolio.isAllReady || portfolio.isReloading}
                      testID="refresh-button"
                      onHoverIn={() => setIsBalanceHovered(true)}
                      // Increase clickable area using prop
                      hitSlop={10}
                    >
                      <RefreshIcon
                        spin={!portfolio.isAllReady || portfolio.isReloading}
                        color="#E3E6EB"
                        width={28}
                        height={28}
                      />
                    </Pressable>
                  ) : (
                    <View style={{ width: 28, height: 28 }} />
                  ) /* Placeholder to keep balance centered on mobile */
                }
              </View>
              <View style={[flexbox.directionRow, flexbox.justifyCenter, flexbox.alignCenter]}>
                <GasTankButton
                  onPress={() => openGasTankModal?.()}
                  portfolio={portfolio}
                  account={account}
                />
                {/* NOTE: this is commented out instead of deleted because we might wat to return it */}
                {/* <RewardsButton /> */}
              </View>
            </View>
            <Routes />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  )
}

export default React.memo(DashboardOverview)
