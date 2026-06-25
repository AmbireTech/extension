import React, { FC } from 'react'

import { Network as NetworkInterface } from '@ambire-common/interfaces/network'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  network: NetworkInterface
  selectedChainId?: bigint
  handleSelectNetwork: (chainId: bigint) => void
}

const Network: FC<Props> = ({ network, selectedChainId, handleSelectNetwork }) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: `${String(theme.secondaryBackground)}00`,
      to: theme.secondaryBackground
    }
  })

  return (
    <AnimatedPressable
      key={network.chainId.toString()}
      onPress={() => handleSelectNetwork(network.chainId)}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.pvTy,
        spacings.phTy,
        common.borderRadiusPrimary,
        spacings.mbMi,
        {
          backgroundColor:
            network.chainId === selectedChainId
              ? theme.secondaryBackground
              : animStyle.backgroundColor
        }
      ]}
      {...bindAnim}
    >
      <NetworkIcon size={28} id={network.chainId.toString()} />
      <Text
        fontSize={16}
        weight="medium"
        appearance="secondaryText"
        style={spacings.mlTy}
        numberOfLines={1}
      >
        {network.name}
      </Text>
    </AnimatedPressable>
  )
}

export default React.memo(Network)
