import React from 'react'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import PlugDisconnectIcon from '@common/assets/svg/PlugDisconnectIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

const DisconnectButton = ({
  dapp,
  setIsOpen
}: {
  dapp: Dapp
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const { dispatch } = useBackgroundService()
  const { theme } = useTheme()

  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.errorBackground
    }
  })

  return (
    <AnimatedPressable
      {...bindAnim}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phTy,
        spacings.pvTy,
        spacings.mbTy,
        animStyle,
        { borderRadius: 8 }
      ]}
      onPress={() => {
        dispatch({
          type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP',
          params: { id: dapp.id, url: dapp.url }
        })
        setIsOpen(false)
      }}
    >
      <View style={{ width: 20, height: 20, ...flexbox.center }}>
        <PlugDisconnectIcon
          color={isHovered ? theme.errorText : theme.iconPrimary}
          width={16}
          height={16}
        />
      </View>
      <Text
        weight="medium"
        fontSize={14}
        appearance={isHovered ? 'errorText' : 'primaryText'}
        style={spacings.mlTy}
      >
        Disconnect
      </Text>
    </AnimatedPressable>
  )
}

export default React.memo(DisconnectButton)
