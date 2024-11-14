import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import WarningIcon from '@common/assets/svg/WarningIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { useTranslation } from '@common/config/localization'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import Gradients from '@common/modules/dashboard/components/Gradients/Gradients'
import Routes from '@common/modules/dashboard/components/Routes'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/screens/DashboardScreen'
import { DASHBOARD_OVERVIEW_BACKGROUND } from '@common/modules/dashboard/screens/styles'
import spacings, { SPACING, SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import formatDecimals from '@common/utils/formatDecimals'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import GasTankButton from '../DashboardHeader/GasTankButton'
import RefreshIcon from './RefreshIcon'
import getStyles from './styles'

interface Props {
  openReceiveModal: () => void
  openGasTankModal: () => void
  animatedOverviewHeight: Animated.Value
  dashboardOverviewSize: {
    width: number
    height: number
  }
  setDashboardOverviewSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>
  onGasTankButtonPosition: (position: {
    x: number
    y: number
    width: number
    height: number
  }) => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
  portfolioStartedLoadingAtTimestamp: number | null
}

// We create a reusable height constant for both the Balance line-height and the Balance skeleton.
// We want both components to have the same height; otherwise, clicking on the RefreshIcon causes a layout shift.
const BALANCE_HEIGHT = 34

const DashboardOverview: FC<Props> = ({
  openReceiveModal,
  openGasTankModal,
  animatedOverviewHeight,
  dashboardOverviewSize,
  setDashboardOverviewSize,
  onGasTankButtonPosition,
  portfolio,
  account,
  portfolioStartedLoadingAtTimestamp
}) => {
  const route = useRoute()
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { networks } = useNetworksControllerState()
  // const { account, portfolio, portfolioStartedLoadingAtTimestamp } =
  //   useSelectedAccountControllerState()

  const [bindRefreshButtonAnim, refreshButtonAnimStyle] = useHover({
    preset: 'opacity'
  })
  const [isLoadingTakingTooLong, setIsLoadingTakingTooLong] = useState(false)

  const filterByNetworkId = route?.state?.filterByNetworkId || null

  const totalPortfolioAmount = useMemo(() => {
    if (!filterByNetworkId) return portfolio?.totalBalance || 0

    if (!account) return 0

    return Number(portfolio?.latestStateByNetworks?.[filterByNetworkId]?.result?.total?.usd) || 0
  }, [portfolio, filterByNetworkId, account])

  const [totalPortfolioAmountInteger, totalPortfolioAmountDecimal] = formatDecimals(
    totalPortfolioAmount,
    'price'
  ).split('.')

  const networksWithCriticalErrors: string[] = useMemo(() => {
    if (!account || !portfolio.latestStateByNetworks || portfolio.latestStateByNetworks?.isLoading)
      return []

    const networkNames: string[] = []

    Object.keys(portfolio.latestStateByNetworks).forEach((networkId) => {
      const networkState = portfolio.latestStateByNetworks[networkId]

      if (networkState?.criticalError) {
        let networkName

        if (networkId === 'gasTank') networkName = 'Gas Tank'
        else if (networkId === 'rewards') networkName = 'Rewards'
        else networkName = networks.find((n) => n.id === networkId)?.name

        if (!networkName) return

        networkNames.push(networkName)
      }
    })

    return networkNames
  }, [account, portfolio, networks])

  const warningMessage = useMemo(() => {
    if (isLoadingTakingTooLong) {
      return t('Loading all networks is taking too long.')
    }

    if (networksWithCriticalErrors.length) {
      return t('Total balance may be inaccurate due to network issues on {{networks}}', {
        networks: networksWithCriticalErrors.join(', ')
      })
    }

    return undefined
  }, [isLoadingTakingTooLong, networksWithCriticalErrors, t])

  // Compare the current timestamp with the timestamp when the loading started
  // and if it takes more than 5 seconds, set isLoadingTakingTooLong to true
  useEffect(() => {
    if (!portfolioStartedLoadingAtTimestamp) {
      setIsLoadingTakingTooLong(false)
      return
    }

    const checkIsLoadingTakingTooLong = () => {
      const takesMoreThan5Seconds = Date.now() - portfolioStartedLoadingAtTimestamp > 5000

      setIsLoadingTakingTooLong(takesMoreThan5Seconds)
    }

    checkIsLoadingTakingTooLong()

    const interval = setInterval(() => {
      if (portfolio?.isAllReady) {
        clearInterval(interval)
        setIsLoadingTakingTooLong(false)
        return
      }

      checkIsLoadingTakingTooLong()
    }, 500)

    return () => {
      clearInterval(interval)
    }
  }, [portfolio?.isAllReady, portfolioStartedLoadingAtTimestamp])

  const reloadAccount = useCallback(() => {
    dispatch({ type: 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT' })
  }, [dispatch])

  const [buttonPosition, setButtonPosition] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    if (buttonPosition) {
      onGasTankButtonPosition(buttonPosition)
    }
  }, [buttonPosition, onGasTankButtonPosition])

  return (
    <View style={[spacings.phSm, spacings.mbMi]}>
      <View style={[styles.contentContainer]}>
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
              backgroundColor: DASHBOARD_OVERVIEW_BACKGROUND,
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
          <Gradients
            width={dashboardOverviewSize.width}
            height={dashboardOverviewSize.height}
            selectedAccount={account?.addr || null}
          />
          <View style={{ zIndex: 2 }}>
            <DashboardHeader />
            <Animated.View
              style={{
                ...styles.overview,
                paddingTop: animatedOverviewHeight.interpolate({
                  inputRange: [0, SPACING_XL],
                  outputRange: [0, SPACING],
                  extrapolate: 'clamp'
                }),
                maxHeight: animatedOverviewHeight,
                overflow: 'hidden'
              }}
            >
              <View>
                <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
                  {!portfolio?.isAllReady ? (
                    <SkeletonLoader
                      lowOpacity
                      width={200}
                      height={BALANCE_HEIGHT}
                      borderRadius={8}
                    />
                  ) : (
                    <View testID="full-balance" style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <Text selectable>
                        <Text
                          fontSize={32}
                          shouldScale={false}
                          style={{ lineHeight: BALANCE_HEIGHT }}
                          weight="number_bold"
                          color={theme.primaryBackground}
                          selectable
                        >
                          {totalPortfolioAmountInteger}
                        </Text>
                        <Text
                          fontSize={20}
                          shouldScale={false}
                          weight="number_bold"
                          color={theme.primaryBackground}
                          selectable
                        >
                          {t('.')}
                          {totalPortfolioAmountDecimal}
                        </Text>
                      </Text>
                    </View>
                  )}
                  <AnimatedPressable
                    style={[spacings.mlTy, refreshButtonAnimStyle]}
                    onPress={reloadAccount}
                    {...bindRefreshButtonAnim}
                    disabled={!portfolio?.isAllReady}
                    testID="refresh-button"
                  >
                    <RefreshIcon
                      spin={!portfolio?.isAllReady}
                      color={theme.primaryBackground}
                      width={16}
                      height={16}
                    />
                  </AnimatedPressable>
                </View>

                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <GasTankButton
                    onPress={openGasTankModal}
                    onPosition={setButtonPosition}
                    portfolio={portfolio}
                    account={account}
                  />
                  {!!warningMessage && (
                    <>
                      <WarningIcon
                        color={theme.warningDecorative}
                        style={spacings.mlTy}
                        data-tooltip-id="portfolio-warning"
                        data-tooltip-content={warningMessage}
                        width={21}
                        height={21}
                      />
                      <Tooltip id="portfolio-warning" />
                    </>
                  )}
                </View>
              </View>
              <Routes openReceiveModal={openReceiveModal} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

export default React.memo(DashboardOverview)
