import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import Avatar from '@common/components/Avatar'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

interface Props {
  address: string
  shouldShow: boolean
}

const InlineAddressAvatar: FC<Props> = ({ address, shouldShow }) => {
  const checksummedAddress = useMemo(() => getAddressCaught(address), [address])
  const accountsState = useController('AccountsController').state
  const {
    state: { domains }
  } = useController('DomainsController')

  const account = useMemo(
    () => accountsState?.accounts?.find((a) => a.addr === checksummedAddress),
    [accountsState?.accounts, checksummedAddress]
  )
  const isEnsAddress = !!domains?.[checksummedAddress]?.ens

  if (!shouldShow || (!isEnsAddress && !account)) return null

  return (
    <View style={spacings.mrMi}>
      <Avatar
        address={checksummedAddress}
        pfp={account?.preferences.pfp || ''}
        size={16}
        displayTypeBadge={false}
      />
    </View>
  )
}

export default React.memo(InlineAddressAvatar)
