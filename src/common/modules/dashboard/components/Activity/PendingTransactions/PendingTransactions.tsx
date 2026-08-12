import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import usePendingSafeTransactions from '@common/modules/dashboard/hooks/usePendingSafeTransactions'
import spacings from '@common/styles/spacings'

import PendingChainTransactions from './PendingChainTransactions'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccountAddr = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account?.addr

/**
 * Lists the pending Safe transactions of the selected account, grouped per chain. Renders
 * nothing for accounts that are not Safe accounts or that have no pending transactions.
 */
const PendingTransactions = () => {
  const { t } = useTranslation()
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { networkGroups, currentNonces } = usePendingSafeTransactions()

  if (!networkGroups.length) return null

  return (
    <View style={spacings.mbSm}>
      <Text fontSize={14} weight="medium" style={spacings.mbTy}>
        {t('Pending transactions')}
      </Text>
      {networkGroups.map((group) => (
        <PendingChainTransactions
          key={`${accountAddr}-${group.network.chainId.toString()}`}
          group={group}
          currentNonce={currentNonces[group.network.chainId.toString()]}
        />
      ))}
    </View>
  )
}

export default React.memo(PendingTransactions)
