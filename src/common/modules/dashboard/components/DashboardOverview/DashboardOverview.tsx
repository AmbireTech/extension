import React, { FC, useCallback, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

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
import spacings, { SPACING_TY } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'

import BalanceAffectingErrors from './BalanceAffectingErrors'
import ColibriVerificationBadge from './ColibriVerificationBadge'
import GasTankButton from './GasTankButton'
import { OverviewBackground } from './OverviewBackground'
import OverviewCollapsible from './OverviewCollapsible'
import type { OverviewCollapsibleProps } from './OverviewCollapsible/OverviewCollapsible'
import type { OverviewCollapse } from '../DashboardPagesCarousel/DashboardPagesCarousel'
import RefreshIcon from './RefreshIcon'
import getStyles from './styles'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

interface Props {
  openGasTankModal?: () => void
  /** The overview is never resized: the pages slide over its collapsing part instead. */
  onCollapsibleHeightChange?: OverviewCollapsibleProps['onHeightChange']
  /** How far the pages have slid over the collapsing part. Moves the background. */
  overviewCollapse?: OverviewCollapse
}

const selectTokenPricesEnabled = (state: IFeatureFlagsController) => state.flags?.tokenPrices

const DashboardOverview: FC<Props> = ({
  openGasTankModal,
  onCollapsibleHeightChange,
  overviewCollapse
}) => {
  const { theme } = useTheme(getStyles)
  const { state: isOffline } = useController('MainController', 'isOffline')
  const { account, portfolio } = useController('SelectedAccountController').state
  const { state: areNetworksFetchingFromRelayer } = useController(
    'NetworksController',
    'areNetworksFetchingFromRelayer'
  )
  const { state: isTokenPricesEnabled } = useController(
    'FeatureFlagsController',
    selectTokenPricesEnabled
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
      <View
        style={[
          common.borderRadiusPrimary,
          spacings.ptTy,
          isWeb && spacings.phSm,
          isMobile && spacings.phTy,
          {
            // The rest of the open padding is covered together with the content
            paddingBottom: SPACING_TY,
            overflow: 'hidden'
          }
        ]}
      >
        <OverviewBackground address={account?.addr || ''} collapse={overviewCollapse} />
        <View style={{ zIndex: 2 }}>
          <DashboardHeader />
          <OverviewCollapsible onHeightChange={onCollapsibleHeightChange}>
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
                    isTokenPricesEnabled={isTokenPricesEnabled}
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
                <GasTankButton onPress={() => openGasTankModal?.()} account={account} />
              </View>
            </View>
            <Routes />
          </OverviewCollapsible>
        </View>
      </View>
    </View>
  )
}

export default React.memo(DashboardOverview)
