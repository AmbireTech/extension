import React, { FC, useCallback, useMemo, useState } from 'react'
import { Animated, Platform, Pressable, View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import Routes from '@common/modules/dashboard/components/Routes'
import useBalanceAffectingErrors from '@common/modules/dashboard/hooks/useBalanceAffectingErrors'
import useBanners from '@common/modules/dashboard/hooks/useBanners'
import spacings, { SPACING, SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
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
  const [controllerBanners, marketingBanners] = useBanners()
  const banners = [...controllerBanners, ...marketingBanners]
  const {
    state: { isOffline },
    dispatch: mainDispatch
  } = useController('MainController')
  const { account, dashboardNetworkFilter, portfolio } = useController(
    'SelectedAccountController'
  ).state
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

  const reloadAccount = useCallback(() => {
    mainDispatch({
      type: 'method',
      params: {
        method: 'reloadSelectedAccount',
        args: [
          {
            chainIds: dashboardNetworkFilter ? [BigInt(dashboardNetworkFilter)] : undefined,
            isManualReload: true
          }
        ]
      }
    })
  }, [dashboardNetworkFilter, mainDispatch])

  return (
    <View style={[spacings.phSm, spacings.mbTy]}>
      <Animated.View
        style={[
          common.borderRadiusPrimary,
          spacings.ptTy,
          spacings.phSm,
          {
            paddingBottom: animatedOverviewHeight.interpolate({
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
                outputRange: [0, SPACING],
                extrapolate: 'clamp'
              }),
              maxHeight: animatedOverviewHeight,
              overflow: 'hidden'
            }}
          >
            <View style={[spacings.mb, flexbox.alignCenter]}>
              <Pressable
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  spacings.mbMi,
                  { height: BALANCE_HEIGHT }
                ]}
                onHoverIn={() => setIsBalanceHovered(true)}
                onHoverOut={() => setIsBalanceHovered(false)}
                hitSlop={8}
              >
                {/* Placeholder matching the refresh button size to keep the balance centered */}
                <View style={{ width: 28, height: 28 }} />
                <View style={[flexbox.flex1, flexbox.alignCenter, spacings.mhTy]}>
                  {!portfolio?.isReadyToVisualize ? (
                    <SkeletonLoader
                      lowOpacity
                      width={180}
                      height={BALANCE_HEIGHT}
                      borderRadius={8}
                    />
                  ) : (
                    <Text testID="full-balance">
                      <Text
                        fontSize={34}
                        shouldScale={false}
                        weight="number_bold"
                        // Line height should be constant based on font size, not on parent height
                        style={Platform.OS !== 'web' ? { lineHeight: 36 } : { lineHeight: 28 }}
                        color={
                          networksWithErrors.length || isOffline
                            ? theme.warningDecorative2
                            : '#FFFFFF'
                        }
                        testID="total-portfolio-amount-integer"
                      >
                        {totalPortfolioAmountIntegerFormattedPart}
                      </Text>
                      {totalPortfolioAmount < THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS && (
                        <Text
                          fontSize={20}
                          shouldScale={false}
                          weight="number_bold"
                          color={
                            networksWithErrors.length || isOffline
                              ? theme.warningDecorative2
                              : '#FFFFFF'
                          }
                        >
                          {t('.')}
                          {totalPortfolioAmountDecimalFormattedPart}
                        </Text>
                      )}
                    </Text>
                  )}
                </View>
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
              </Pressable>

              <View style={[flexbox.directionRow, flexbox.justifyCenter, flexbox.alignCenter]}>
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
                <GasTankButton
                  onPress={() => openGasTankModal?.()}
                  portfolio={portfolio}
                  account={account}
                />
                <RewardsButton />
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
