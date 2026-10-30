import { useCallback, useEffect, useMemo, useRef } from 'react'

import { Account, AccountOnchainState } from '@ambire-common/interfaces/account'
import { Network } from '@ambire-common/interfaces/network'
import { has7702 } from '@ambire-common/libs/7702/7702'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import useController from '@common/hooks/useController'
import { AMBIRE_SIGNER_DEVICE_MODELS } from '@common/modules/hardware-wallet/libs/ledgerAppInstall/artifacts'
import { DeviceModelId } from '@ledgerhq/device-management-kit'

import { getIsDelegationEnableDisabled } from './helpers'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** What an account has delegated to on one EIP-7702 network */
export interface SmartSettingsNetworkRow {
  network: Network
  /** The account state of this network has not loaded yet */
  isLoading: boolean
  delegatedContract?: AccountOnchainState['delegatedContract']
  delegatedContractName?: AccountOnchainState['delegatedContractName']
  /** Turning the upgrade on needs the EIP-7702 feature flag first */
  isEnableDisabled: boolean
}

// The Ledger models that can't install Ambire Signer, by DMK model id
const UNSUPPORTED_LEDGER_MODEL_NAMES: Record<string, string> = {
  [DeviceModelId.NANO_S]: 'Ledger Nano S',
  [DeviceModelId.NANO_X]: 'Ledger Nano X'
}

// The ids that the pre-DMK @ledgerhq/devices saved, where they differ from DMK's
const LEGACY_LEDGER_MODEL_IDS: Record<string, string> = {
  europa: DeviceModelId.FLEX,
  apex: DeviceModelId.APEX
}

const getLedgerModelId = (deviceModel: string) =>
  LEGACY_LEDGER_MODEL_IDS[deviceModel] || deviceModel

const selectAccountStates = (state: AllControllersMappingType['AccountsController']) =>
  state.accountStates
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks
const selectIsEip7702Enabled = (state: AllControllersMappingType['FeatureFlagsController']) =>
  state.flags.eip7702

/**
 * The data and actions behind an account's smart settings (EIP-7702), shared by
 * the extension's modal and the mobile screen.
 */
const useAccountSmartSettings = (account: Account | null) => {
  const { state: accountStates, dispatch: accountsDispatch } = useController(
    'AccountsController',
    selectAccountStates
  )
  const { state: keys } = useController('KeystoreController', selectKeys)
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { state: isEip7702Enabled, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectIsEip7702Enabled
  )
  const accountStateCheckedForRef = useRef<string | null>(null)

  const accountState = useMemo(() => {
    if (!account) return null

    return accountStates[account.addr] || null
  }, [account, accountStates])

  const delegationNetworks = useMemo(() => networks.filter((n) => has7702(n)), [networks])

  useEffect(() => {
    const checkedForThisAcc = accountStateCheckedForRef.current === account?.addr

    if (checkedForThisAcc || !account || !!accountState || delegationNetworks.length === 0) return

    accountStateCheckedForRef.current = account.addr

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [account.addr, 'latest', delegationNetworks.map((n) => n.chainId)]
      }
    })
  }, [accountState, delegationNetworks, account, accountsDispatch])

  const is7702 = useMemo(() => {
    if (!account) return false

    return canBecomeSmarter(
      account,
      keys.filter((k) => account.associatedKeys.includes(k.addr))
    )
  }, [account, keys])

  const ledgerKeys = useMemo(
    () =>
      account
        ? keys.filter((k) => account.associatedKeys.includes(k.addr) && k.type === 'ledger')
        : [],
    [account, keys]
  )

  // Only for the Ledger models Ambire Signer can be installed on. An unknown
  // model (keys imported on mobile before it was recorded) is left out too
  const canInstallAmbireSigner = useMemo(
    () =>
      ledgerKeys.some((k) =>
        AMBIRE_SIGNER_DEVICE_MODELS.includes(getLedgerModelId(k.meta.deviceModel))
      ),
    [ledgerKeys]
  )

  const hasInternalKey = useMemo(
    () =>
      !!account &&
      keys.some((k) => account.associatedKeys.includes(k.addr) && k.type === 'internal'),
    [account, keys]
  )

  // A Ledger that can't get Ambire Signer can neither enable nor revoke, as both
  // sign with it. A key stored in the app can still sign instead
  const isUnsupportedLedger = ledgerKeys.length > 0 && !canInstallAmbireSigner && !hasInternalKey
  // Null when the saved model is 'unknown'
  const unsupportedLedgerModelName =
    (isUnsupportedLedger && UNSUPPORTED_LEDGER_MODEL_NAMES[ledgerKeys[0]!.meta.deviceModel]) || null

  const networkRows: SmartSettingsNetworkRow[] = useMemo(
    () =>
      delegationNetworks.map((network) => {
        const networkState = accountState?.[network.chainId.toString()]

        return {
          network,
          isLoading: !networkState,
          delegatedContract: networkState?.delegatedContract,
          delegatedContractName: networkState?.delegatedContractName,
          isEnableDisabled: getIsDelegationEnableDisabled(
            isEip7702Enabled,
            networkState?.delegatedContract
          )
        }
      }),
    [accountState, delegationNetworks, isEip7702Enabled]
  )

  const enableEip7702 = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlag',
        args: ['eip7702', true]
      }
    })
  }, [featureFlagsDispatch])

  // Builds the request that turns the upgrade on, or revokes it when there is one
  const delegate = useCallback(
    (chainId: bigint) => {
      const network = networks.find((n) => n.chainId === chainId)
      if (!network || !account || !accountState || !accountState[chainId.toString()]) return

      const delegatedContract = accountState[chainId.toString()]?.delegatedContract
      if (getIsDelegationEnableDisabled(isEip7702Enabled, delegatedContract)) return

      requestsDispatch({
        type: 'method',
        params: {
          method: 'build',
          args: [
            {
              type: 'calls',
              params: {
                allowAccountSwitch: true,
                userRequestParams: {
                  calls: [{ to: ZERO_ADDRESS, data: '0x', value: BigInt(0) }],
                  meta: {
                    chainId: network.chainId,
                    accountAddr: account.addr,
                    setDelegation: !delegatedContract
                  }
                }
              }
            }
          ]
        }
      })
    },
    [account, accountState, isEip7702Enabled, networks, requestsDispatch]
  )

  return {
    is7702,
    canInstallAmbireSigner,
    isUnsupportedLedger,
    unsupportedLedgerModelName,
    isEip7702Enabled,
    networkRows,
    enableEip7702,
    delegate
  }
}

export default useAccountSmartSettings
