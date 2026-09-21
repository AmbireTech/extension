import React, { FC, useMemo } from 'react'

import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import Avatar from '@common/components/Avatar'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  address: string
  shouldShow: boolean
}

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectDomains = (state: AllControllersMappingType['DomainsController']) => state.domains

const InlineAddressAvatar: FC<Props> = ({ address, shouldShow }) => {
  const checksummedAddress = useMemo(() => getAddressCaught(address), [address])
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: domains } = useController('DomainsController', selectDomains)

  const account = useMemo(
    () => accounts?.find((a) => a.addr === checksummedAddress),
    [accounts, checksummedAddress]
  )
  const isEnsAddress = !!domains?.[checksummedAddress]?.names?.ens

  if (!shouldShow || (!isEnsAddress && !account)) return null

  return (
    <Avatar
      address={checksummedAddress}
      pfp={account?.preferences.pfp || ''}
      size={16}
      displayTypeBadge={false}
    />
  )
}

export default React.memo(InlineAddressAvatar)
