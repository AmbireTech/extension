import React, { FC, useMemo } from 'react'
import { Image, View } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { HumanizerMeta } from '@ambire-common/libs/humanizer/interfaces'
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
  chainId: bigint
}
const HUMANIZER_META = humanizerInfo as HumanizerMeta

const HumanizerAddress: FC<Props> = ({
  address,
  highestPriorityAlias,
  marginRight,
  hideLinks = false,
  chainId,
  ...rest
}) => {
  const { styles } = useTheme(getStyles)

  const addressInfo: any = useMemo(
    () => HUMANIZER_META.knownAddresses[address.toLocaleLowerCase()],
    [address]
  )

  return (
    <View style={{ ...flexbox.directionRow, marginRight }}>
      {addressInfo?.logo && <Image source={{ uri: addressInfo.logo }} style={styles.logo} />}
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
