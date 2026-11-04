import React, { useMemo } from 'react'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import WalletIcon from '@common/assets/svg/WalletIcon'
import Badge from '@common/components/Badge'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { getBalanceAffectedNetworkNames } from '@common/modules/dashboard/helpers/balanceWarnings'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/theme/types'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const ICON_SIZE = 14
/** The spinner's circle takes only ~41% of its box, so this draws a ~9px one next to the 12px text */
const SPINNER_SIZE = 22
/** Lets the spinner's box overflow, so it takes only a 12px slot in the badge */
const SPINNER_INSET = -(SPINNER_SIZE - 12) / 2

const selectIsReadyToVisualize = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.isReadyToVisualize
const selectTotalBalance = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.totalBalance
const selectBalanceAffectingErrors = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.balanceAffectingErrors
const selectVerification = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.verification
const selectAllNetworks = (state: AllControllersMappingType['NetworksController']) =>
  state.allNetworks
const selectAreNetworksFetchingFromRelayer = (
  state: AllControllersMappingType['NetworksController']
) => state.areNetworksFetchingFromRelayer
const selectIsOffline = (state: AllControllersMappingType['MainController']) => state.isOffline

/**
 * The account's total balance in a badge. A spinner takes the amount's place while it loads,
 * and the amount turns yellow when it may be incomplete.
 */
const BalanceBadge = ({
  balance,
  isLoading = false,
  isPartial = false
}: {
  balance: number
  isLoading?: boolean
  isPartial?: boolean
}) => {
  const { theme, themeType } = useTheme()

  return (
    <Badge
      style={{
        columnGap: SPACING_MI,
        // The icon leads, like the avatar on the Safe signer badges
        paddingLeft: SPACING_MI,
        // The badge leaves room only for a trailing info icon when it has children
        paddingRight: SPACING_TY,
        // Stands out from the card in either theme, as the card is in the secondary one
        backgroundColor: theme.primaryBackground
      }}
    >
      <WalletIcon width={ICON_SIZE} height={ICON_SIZE} color={theme.secondaryText} />
      {isLoading ? (
        // The currency stays, the spinner takes the amount's place, both in the text's color
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={12} weight="semiBold" color={theme.primaryText}>
            $
          </Text>
          <Spinner
            variant={themeType === THEME_TYPES.DARK ? 'white' : 'black'}
            style={{ width: SPINNER_SIZE, height: SPINNER_SIZE, margin: SPINNER_INSET }}
          />
        </View>
      ) : (
        <Text
          fontSize={12}
          weight="semiBold"
          color={isPartial ? theme.warningDecorative2 : theme.primaryText}
        >
          {formatDecimals(balance, 'value')}
        </Text>
      )}
    </Badge>
  )
}

/**
 * The selected account's balance as the dashboard shows it right now: loading, partial or
 * loaded, rather than the last fully loaded one the other accounts show.
 */
const SelectedAccountBalanceBadge = () => {
  const { state: isReadyToVisualize } = useController(
    'SelectedAccountController',
    selectIsReadyToVisualize
  )
  const { state: totalBalance } = useController('SelectedAccountController', selectTotalBalance)
  const { state: balanceAffectingErrors } = useController(
    'SelectedAccountController',
    selectBalanceAffectingErrors
  )
  const { state: verification } = useController('SelectedAccountController', selectVerification)
  const { state: allNetworks } = useController('NetworksController', selectAllNetworks)
  const { state: areNetworksFetchingFromRelayer } = useController(
    'NetworksController',
    selectAreNetworksFetchingFromRelayer
  )
  const { state: isOffline } = useController('MainController', selectIsOffline)

  // The same conditions the dashboard shows its balance as loading or in yellow on
  const isPartial = useMemo(
    () =>
      isOffline ||
      !!getBalanceAffectedNetworkNames({
        balanceAffectingErrors,
        verification,
        allNetworks,
        areNetworksFetchingFromRelayer
      }).length,
    [allNetworks, areNetworksFetchingFromRelayer, balanceAffectingErrors, isOffline, verification]
  )

  return (
    <BalanceBadge
      balance={totalBalance}
      isLoading={!isReadyToVisualize || areNetworksFetchingFromRelayer}
      isPartial={isPartial}
    />
  )
}

export { BalanceBadge, SelectedAccountBalanceBadge }
