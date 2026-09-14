import React, { FC, useCallback, useMemo, useState } from 'react'
import { Animated, Pressable, View } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DashboardBalance, {
  BALANCE_HEIGHT
} from '@common/modules/dashboard/components/DashboardBalance'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import Routes from '@common/modules/dashboard/components/Routes'
import useBalanceAffectingErrors from '@common/modules/dashboard/hooks/useBalanceAffectingErrors'
import useDashboardReload from '@common/modules/dashboard/hooks/useDashboardReload'
import spacings, { SPACING, SPACING_SM, SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'

import BalanceAffectingErrors from './BalanceAffectingErrors'
import ColibriVerificationBadge from './ColibriVerificationBadge'
import GasTankButton from './GasTankButton'
import { OverviewBackground } from './OverviewBackground'
import RefreshIcon from './RefreshIcon'
import getStyles from './styles'

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

const DashboardOverview: FC<Props> = ({
  openGasTankModal,
  animatedOverviewHeight,
  setDashboardOverviewSize
}) => {
  const { theme } = useTheme(getStyles)
  const { state: isOffline } = useController('MainController', 'isOffline')
  const { account, portfolio } = useController('SelectedAccountController').state
  const { state: areNetworksFetchingFromRelayer } = useController(
    'NetworksController',
    'areNetworksFetchingFromRelayer'
  )
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
  const totalPortfolioAmountColor = useMemo(
    () => (networksWithErrors.length || isOffline ? theme.warningDecorative2 : '#FFFFFF'),
    [isOffline, networksWithErrors.length, theme.warningDecorative2]
  )

  // Display the button always on mobile
  const shouldShowRefreshButton = isBalanceHovered || !portfolio?.isReadyToVisualize || !isExtension

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
                  {/* Keep the balance in the skeleton state while the networks
                  config is being refreshed from the relayer — an updated RPC may
                  trigger a portfolio reload, and we want to show the fresh result
                  rather than flashing a value computed from the stale RPC. */}
                  <DashboardBalance
                    variant={
                      !portfolio?.isReadyToVisualize || areNetworksFetchingFromRelayer
                        ? 'skeleton'
                        : 'ready'
                    }
                    totalAmount={totalPortfolioAmount}
                    color={totalPortfolioAmountColor}
                    isPrivacyModeEnabled={isPrivacyModeEnabled}
                    onPress={togglePrivacyMode}
                    testID="full-balance"
                    badge={
                      !warningMessage ? (
                        <ColibriVerificationBadge
                          color={totalPortfolioAmountColor}
                          isVisible={shouldShowRefreshButton}
                        />
                      ) : null
                    }
                  />
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
