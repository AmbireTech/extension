import { useMemo, useRef, useState } from 'react'

import { getIsViewOnly } from '@ambire-common/utils/accounts'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import { useMultiHover } from '@common/hooks/useHover'
import useNetworks from '@common/hooks/useNetworks'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { hexToRgba } from '@common/styles/utils/common'

const MAX_VISIBLE_NETWORKS = isMobile ? 8 : 10

const useReceive = () => {
  const { state } = useRoute()
  const { address } = state || {}

  const {
    state: { account: stateAccount }
  } = useController('SelectedAccountController')

  const {
    state: { accounts }
  } = useController('AccountsController')

  const account = useMemo(() => {
    if (address) {
      const foundAcc = accounts.find((acc) => acc.addr === address)
      if (foundAcc) return foundAcc
    }

    return stateAccount
  }, [accounts, address, stateAccount])

  const {
    isLoading: isDomainResolving,
    ens,
    namoshi
  } = useReverseLookup({
    address: account?.addr || ''
  })
  const { keys } = useController('KeystoreController').state
  const { theme } = useTheme()
  const qrCodeRef: any = useRef(null)
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)

  const isViewOnly = useMemo(() => {
    return !account?.safeCreation && getIsViewOnly(keys, account?.associatedKeys || [])
  }, [account, keys])

  const { label, pfp } = account?.preferences || { label: '', pfp: '' }

  const [showAllNetworks, setShowAllNetworks] = useState(false)

  const supportedNetworks = useNetworks({ acc: account })
  const accountNetworks = supportedNetworks.filter((n) => !n.isNotSupported)

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
    return accountNetworks.length > MAX_VISIBLE_NETWORKS
  }, [accountNetworks.length])

  const alwaysVisible = useMemo(() => {
    return accountNetworks.slice(0, MAX_VISIBLE_NETWORKS)
  }, [accountNetworks])

  const extraNetworks = useMemo(() => {
    return accountNetworks.slice(MAX_VISIBLE_NETWORKS)
  }, [accountNetworks])

  return {
    account,
    isViewOnly,
    label,
    pfp,
    ens,
    namoshi,
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
    setShowAllNetworks,
    isEOA: !account?.creation && !account?.safeCreation
  }
}

export default useReceive
