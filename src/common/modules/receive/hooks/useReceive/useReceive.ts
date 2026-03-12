import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getIsViewOnly } from '@ambire-common/utils/accounts'
import useController from '@common/hooks/useController'
import { useMultiHover } from '@common/hooks/useHover'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { hexToRgba } from '@common/styles/utils/common'

const useReceive = () => {
  const { state } = useRoute()
  const { address } = state || {}
  const accountStateCheckedForRef = React.useRef<string | null>(null)

  const {
    state: { account: stateAccount }
  } = useController('SelectedAccountController')

  const {
    state: { accounts, accountStates },
    dispatch: accountsDispatch
  } = useController('AccountsController')

  const account = useMemo(() => {
    if (address) {
      const foundAcc = accounts.find((acc) => acc.addr === address)
      if (foundAcc) return foundAcc
    }

    return stateAccount
  }, [accounts, address, stateAccount])

  const { isLoading: isDomainResolving, ens } = useReverseLookup({
    address: account?.addr || ''
  })
  const { networks } = useController('NetworksController').state
  const { keys } = useController('KeystoreController').state
  const { t } = useTranslation()
  const { theme } = useTheme()
  const qrCodeRef: any = useRef(null)
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)

  useEffect(() => {
    // fetch the account state for this account if not fetched
    const checkedForThisAcc = accountStateCheckedForRef.current === account?.addr
    if (checkedForThisAcc || !account || !account.safeCreation || !!accountStates[account.addr])
      return

    accountStateCheckedForRef.current = account.addr

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [account.addr, 'latest']
      }
    })
  }, [account, accountStates, accountsDispatch])

  const isViewOnly = useMemo(() => {
    return !account?.safeCreation && getIsViewOnly(keys, account?.associatedKeys || [])
  }, [account, keys])

  const { label, pfp } = account?.preferences || { label: '', pfp: '' }

  const MAX_VISIBLE_NETWORKS = 10
  const [showAllNetworks, setShowAllNetworks] = useState(false)

  const supportedNetworks = useMemo(() => {
    if (!account || !account.safeCreation) return networks
    if (!accountStates[account.addr]) return []

    return networks.filter((n) => {
      const networkAccState = accountStates[account.addr]?.[n.chainId.toString()]
      if (!networkAccState) return true
      return networkAccState.isDeployed
    })
  }, [account, accountStates, networks])

  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: hexToRgba(theme.secondaryBackground, 0),
        to: theme.secondaryBackground
      },
      {
        property: 'translateX',
        from: 0,
        to: showAllNetworks ? -2 : 2
      },
      {
        property: 'translateY',
        from: 0,
        to: 2
      }
    ]
  })

  const hasMoreNetworks = useMemo(() => {
    return networks.length > MAX_VISIBLE_NETWORKS
  }, [networks.length])

  const alwaysVisible = useMemo(() => {
    return supportedNetworks.slice(0, MAX_VISIBLE_NETWORKS)
  }, [supportedNetworks])

  const extraNetworks = useMemo(() => {
    return supportedNetworks.slice(MAX_VISIBLE_NETWORKS)
  }, [supportedNetworks])

  return {
    account,
    isViewOnly,
    label,
    pfp,
    ens,
    isDomainResolving,
    qrCodeError,
    setQrCodeError,
    qrCodeRef,
    bindAnim,
    animStyle,
    hasMoreNetworks,
    alwaysVisible,
    extraNetworks,
    showAllNetworks,
    setShowAllNetworks
  }
}

export default useReceive
