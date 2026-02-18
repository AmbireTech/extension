import React, { FC } from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import AaveIcon from '@common/assets/svg/AaveIcon'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import UniswapIcon from '@common/assets/svg/UniswapIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

const POSITION_TO_ICON: {
  [key: string]: FC<SvgProps>
} = {
  Ambire: AmbireLogo,
  'Uniswap V3': UniswapIcon,
  'Uniswap V2': UniswapIcon,
  'AAVE v3': AaveIcon,
  'AAVE v2': AaveIcon,
  'AAVE v1': AaveIcon
}

const ProtocolIcon = ({
  providerName,
  chainId,
  iconUrl
}: {
  providerName: string
  chainId: bigint
  iconUrl?: string
}) => {
  const { theme, themeType } = useTheme()
  const Icon = POSITION_TO_ICON[providerName]

  return (
    <View style={spacings.mrSm}>
      {iconUrl ? (
        <TokenIcon
          withContainer
          chainId={chainId}
          uri={iconUrl}
          containerHeight={32}
          containerWidth={32}
          width={24}
          height={24}
        />
      ) : Icon ? (
        <View>
          <View
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.neutral200,
              ...common.borderRadiusPrimary
            }}
          >
            <Icon width={24} height={24} />
          </View>
          <View
            style={{
              position: 'absolute',
              left: -1,
              top: -1,
              zIndex: 3,
              borderWidth: 1,
              borderColor: theme.neutral200,
              borderRadius: 12
            }}
          >
            <NetworkIcon id={chainId.toString()} size={14} />
          </View>
        </View>
      ) : null}
    </View>
  )
}
export default React.memo(ProtocolIcon)
