import React, { useCallback } from 'react'
import { View } from 'react-native'

import RefreshIcon from '@common/assets/svg/RefreshIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import usePendingSafeTransactions from '@common/modules/dashboard/hooks/usePendingSafeTransactions'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import PendingChainTransactions from './PendingChainTransactions'
import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectIsFetchingSafeTxns = (state: AllControllersMappingType['MainController']) =>
  state.statuses.fetchSafeTxns === 'LOADING' || state.statuses.refreshSafeTxns === 'LOADING'

/**
 * Lists the pending Safe transactions of the selected account, grouped per chain, and exposes
 * their fetch state. Renders nothing for accounts that are not Safe accounts.
 */
const PendingTransactions = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: isFetching, dispatch: mainDispatch } = useController(
    'MainController',
    selectIsFetchingSafeTxns
  )
  const { networkGroups, currentNonces } = usePendingSafeTransactions()
  const fetchPendingTransactions = useCallback(() => {
    mainDispatch({
      type: 'method',
      params: { method: 'refreshSafeTxns', args: [] }
    })
  }, [mainDispatch])

  if (!account?.safeCreation) return null

  return (
    <View>
      <View
        style={[
          styles.pendingHeader,
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.phSm,
          spacings.mbTy
        ]}
      >
        <Text fontSize={14} weight="medium" appearance="secondaryText">
          {t('Pending transactions')}
        </Text>
        {isFetching ? (
          <View
            style={[
              styles.fetchButton,
              styles.fetchButtonLoading,
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.phSm
            ]}
          >
            <Spinner style={{ width: 16, height: 16, ...spacings.mrMi }} />
            <Text fontSize={14} appearance="secondaryText">
              {t('Checking...')}
            </Text>
          </View>
        ) : (
          <HoverablePressable
            accessibilityRole="button"
            accessibilityLabel={t('Check for pending transactions')}
            testID="fetch-pending-transactions"
            onPress={fetchPendingTransactions}
            style={[styles.fetchButton, flexbox.directionRow, flexbox.alignCenter, spacings.phSm]}
          >
            <RefreshIcon width={16} height={16} color={theme.linkText} style={spacings.mrMi} />
            <Text fontSize={14} appearance="linkText">
              {t('Check now')}
            </Text>
          </HoverablePressable>
        )}
      </View>
      {networkGroups.map((group) => (
        <PendingChainTransactions
          key={`${account.addr}-${group.network.chainId.toString()}`}
          group={group}
          currentNonce={currentNonces[group.network.chainId.toString()]}
        />
      ))}
    </View>
  )
}

export default React.memo(PendingTransactions)
