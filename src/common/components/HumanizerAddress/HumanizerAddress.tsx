import { getAddress } from 'ethers'
import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import { HumanizerMeta, HumanizerMetaAddress } from '@ambire-common/libs/humanizer/interfaces'
import { Props as TextProps } from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import TokenIcon from '../TokenIcon'
import HumanizerAddressInner from './components/HumanizerAddressInner'

interface Props extends TextProps {
  address: string
  // example of highestPriorityAlias: a name coming from the humanizer's metadata
  highestPriorityAlias?: string
  marginRight?: number
  hideLogo?: boolean
  actionsMode?: 'tooltip' | 'inline'
  chainId: bigint
  verification?: BlacklistedStatus
}
const HUMANIZER_META = humanizerInfo as HumanizerMeta

const HumanizerAddress: FC<Props> = ({
  address,
  highestPriorityAlias,
  marginRight,
  hideLogo = false,
  actionsMode = 'tooltip',
  chainId,
  ...rest
}) => {
  const addressInfo: HumanizerMetaAddress | undefined = useMemo(() => {
    let checksummedAddress: string | undefined

    try {
      checksummedAddress = getAddress(address)
    } catch (e) {
      console.error('Invalid address provided to HumanizerAddress component:', address)
      return undefined
    }

    return HUMANIZER_META.knownAddresses[getAddress(checksummedAddress)] ?? undefined
  }, [address])

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, { marginRight }]}>
      {!!addressInfo?.logo && !hideLogo && (
        <View style={spacings.mrMi}>
          <TokenIcon
            chainId={BigInt(addressInfo.chainIds?.[0] || 1)}
            address={address}
            uri={addressInfo.logo}
            width={24}
            height={24}
            withNetworkIcon={false}
          />
        </View>
      )}
      <HumanizerAddressInner
        address={address}
        humanizerInfo={addressInfo}
        highestPriorityAlias={highestPriorityAlias}
        actionsMode={actionsMode}
        chainId={chainId}
        {...rest}
      />
    </View>
  )
}

export default React.memo(HumanizerAddress)
