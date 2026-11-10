import { useCallback } from 'react'

import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import useController from '@common/hooks/useController'
import { getMigrateXWalletCalls } from '@common/modules/wallet-staking/helpers/calls'

import type { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'

const selectXWalletLockedShares = (state: SelectedAccountController) =>
  state.portfolio.walletStaking?.lockedShares
const selectAccountAddr = (state: SelectedAccountController) => state.account?.addr

type Params = {
  address: string
  chainId: bigint
  xWalletAmount: bigint
}

/**
 * Tells whether a token balance is xWALLET that can still be migrated to stkWALLET, and
 * opens the migration request. For any other token `isLegacyXWallet` is `false`.
 */
const useXWalletMigration = ({ address, chainId, xWalletAmount }: Params) => {
  const { state: lockedShares } = useController(
    'SelectedAccountController',
    selectXWalletLockedShares
  )
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { dispatch: requestsDispatch } = useController('RequestsController')

  const isXWallet =
    chainId === ETHEREUM_CHAIN_ID && address.toLowerCase() === WALLET_STAKING_ADDR.toLowerCase()
  // The balance is legacy only while the user can still act on it (migrate to stkWALLET), so
  // it stays `false` until the locked shares are known and leave a free remainder behind. Shares
  // already committed to a pending unstake are locked in the staking contract and can't be migrated.
  const isLegacyXWallet = isXWallet && lockedShares !== undefined && xWalletAmount > lockedShares
  // Only the free (non-locked) part of the balance can be wrapped into stkWALLET
  const migratableShares = isLegacyXWallet ? xWalletAmount - (lockedShares || 0n) : 0n
  const hasLockedShares = isLegacyXWallet && !!lockedShares && lockedShares > 0n

  const migrateXWallet = useCallback(() => {
    if (migratableShares <= 0n || !accountAddr) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              executionType: 'open-request-window',
              userRequestParams: {
                calls: getMigrateXWalletCalls(migratableShares),
                meta: { accountAddr, chainId: ETHEREUM_CHAIN_ID }
              }
            }
          }
        ]
      }
    })
  }, [accountAddr, migratableShares, requestsDispatch])

  return { isLegacyXWallet, hasLockedShares, migrateXWallet }
}

export default useXWalletMigration
