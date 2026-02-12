import React, { FC, useCallback, useMemo } from 'react'
import { Animated, Image, Pressable, View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import Routes from '@common/modules/dashboard/components/Routes'
import useBalanceAffectingErrors from '@common/modules/dashboard/hooks/useBalanceAffectingErrors'
import useBanners from '@common/modules/dashboard/hooks/useBanners'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/screens/DashboardScreen'
import spacings, { SPACING, SPACING_MD, SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import backgroundImage from './background.png'
import BalanceAffectingErrors from './BalanceAffectingErrors'
import GasTankButton from './GasTankButton'
import RefreshIcon from './RefreshIcon'
import RewardsButton from './RewardsButton'
import getStyles from './styles'

const THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS = 10000

interface Props {
  openGasTankModal: () => void
  animatedOverviewHeight: Animated.Value
  dashboardOverviewSize: {
    width: number
    height: number
  }
  setDashboardOverviewSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>
}

// We create a reusable height constant for both the Balance amount height and the Balance skeleton.
// We want both components to have the same height; otherwise, clicking on the RefreshIcon causes a layout shift.
const BALANCE_HEIGHT = 42

const DashboardOverview: FC<Props> = ({
  openGasTankModal,
  animatedOverviewHeight,
  dashboardOverviewSize,
  setDashboardOverviewSize
}) => {
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const [controllerBanners, marketingBanners] = useBanners()
  const banners = [...controllerBanners, ...marketingBanners]
  const { isOffline } = useMainControllerState()
  const { account, dashboardNetworkFilter, portfolio } = useSelectedAccountControllerState()

  const [bindRefreshButtonAnim, refreshButtonAnimStyle] = useHover({
    preset: 'opacityInverted'
  })
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

  const [totalPortfolioAmountIntegerFormattedPart, totalPortfolioAmountDecimalFormattedPart] =
    formatDecimals(totalPortfolioAmount, 'value').split('.')

  const reloadAccount = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT',
      params: {
        chainId: dashboardNetworkFilter ?? undefined
      }
    })
  }, [dashboardNetworkFilter, dispatch])

  return (
    <View style={[spacings.phSm, banners.length ? spacings.mbTy : spacings.mb]}>
      <View style={[styles.contentContainer]}>
        <Animated.View
          style={[
            common.borderRadiusPrimary,
            spacings.ptTy,
            spacings.phSm,
            {
              paddingBottom: animatedOverviewHeight.interpolate({
                inputRange: [0, OVERVIEW_CONTENT_MAX_HEIGHT],
                outputRange: [SPACING_TY, SPACING_MD],
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
          {/* TODO: Style based on selected account; Add overlay in the extension */}
          <Image
            source={{ uri: backgroundImage }}
            style={{
              width: '100%',
              height: OVERVIEW_CONTENT_MAX_HEIGHT,
              position: 'absolute',
              objectFit: 'fill',
              top: 0,
              left: 0
            }}
          />
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
              <View style={[spacings.mbLg, flexbox.alignCenter]}>
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifyCenter,
                    spacings.mbMi,
                    { height: BALANCE_HEIGHT }
                  ]}
                >
                  {!portfolio?.isReadyToVisualize ? (
                    <SkeletonLoader
                      lowOpacity
                      width={180}
                      height={BALANCE_HEIGHT}
                      borderRadius={8}
                    />
                  ) : (
                    <Pressable
                      onPress={onIconPress}
                      disabled={!warningMessage || isLoadingTakingTooLong || isOffline}
                      testID="full-balance"
                      style={[flexbox.directionRow, flexbox.alignCenter]}
                    >
                      <Text selectable>
                        <Text
                          fontSize={36}
                          shouldScale={false}
                          weight="number_bold"
                          // Line height should be constant based on font size, not on parent height
                          style={{ lineHeight: 28 }}
                          color={
                            networksWithErrors.length || isOffline
                              ? theme.warningDecorative2
                              : '#FFFFFF'
                          }
                          selectable
                          testID="total-portfolio-amount-integer"
                        >
                          {totalPortfolioAmountIntegerFormattedPart}
                        </Text>
                        {totalPortfolioAmount < THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS && (
                          <Text
                            fontSize={24}
                            shouldScale={false}
                            weight="number_bold"
                            color={
                              networksWithErrors.length || isOffline
                                ? theme.warningDecorative2
                                : '#FFFFFF'
                            }
                            selectable
                          >
                            {t('.')}
                            {totalPortfolioAmountDecimalFormattedPart}
                          </Text>
                        )}
                      </Text>
                    </Pressable>
                  )}
                  <AnimatedPressable
                    style={[
                      {
                        position: 'absolute',
                        right: -8,
                        top: '50%',
                        transform: [{ translateY: -14 }, { translateX: 28 }]
                      },
                      refreshButtonAnimStyle
                    ]}
                    onPress={reloadAccount}
                    {...bindRefreshButtonAnim}
                    disabled={!portfolio.isAllReady || portfolio.isReloading}
                    testID="refresh-button"
                  >
                    <RefreshIcon
                      spin={!portfolio.isAllReady || portfolio.isReloading}
                      color="#E3E6EB"
                      width={28}
                      height={28}
                    />
                  </AnimatedPressable>
                </View>

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
                    onPress={openGasTankModal}
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
    </View>
  )
}

export default React.memo(DashboardOverview)
