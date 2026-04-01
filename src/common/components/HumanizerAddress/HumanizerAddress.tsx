import { getAddress } from 'ethers'
import React, { FC, useMemo } from 'react'
import { Image, View } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import { HumanizerMeta, HumanizerMetaAddress } from '@ambire-common/libs/humanizer/interfaces'
import { Props as TextProps } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import HumanizerAddressInner from './components/HumanizerAddressInner'
import getStyles from './styles'

interface Props extends TextProps {
  address: string
  // example of highestPriorityAlias: a name coming from the humanizer's metadata
  highestPriorityAlias?: string
  marginRight?: number
  hideLinks?: boolean
  hideLogo?: boolean
  chainId: bigint
  verification?: BlacklistedStatus
}
const HUMANIZER_META = humanizerInfo as HumanizerMeta

const HumanizerAddress: FC<Props> = ({
  address,
  highestPriorityAlias,
  marginRight,
  hideLinks = false,
  hideLogo = false,
  chainId,
  ...rest
}) => {
  const { styles } = useTheme(getStyles)

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
    <View style={{ ...flexbox.directionRow, marginRight }}>
      {!!addressInfo?.logo && !hideLogo && (
        <Image source={{ uri: addressInfo.logo }} style={styles.logo} />
      )}
      <HumanizerAddressInner
        address={address}
        humanizerInfo={addressInfo}
        highestPriorityAlias={highestPriorityAlias}
        hideLinks={hideLinks}
        chainId={chainId}
        {...rest}
      />
    </View>
  )
}

export default React.memo(HumanizerAddress)
