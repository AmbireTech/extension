import React, { FC } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { ActiveStepType } from '@benzin/screens/BenzinScreen/interfaces/steps'
import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import AmbireLogoHorizontalMonochrome from '@common/assets/svg/AmbireLogoHorizontalMonochrome'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  activeStep: ActiveStepType
  network: Network
}

const Header: FC<Props> = ({ activeStep, network }) => {
  const { styles } = useTheme(getStyles)

  return (
    <>
      <View
        style={[
          IS_MOBILE_UP_BENZIN_BREAKPOINT
            ? {}
            : { flexDirection: 'row-reverse', ...flexbox.justifySpaceBetween },
          spacings.mbSm,
          flexbox.alignCenter
        ]}
      >
        <View style={styles.logoWrapper}>
          <AmbireLogoHorizontalMonochrome
            width={isWeb ? 96 : undefined}
            height={isWeb ? 32 : undefined}
          />
        </View>
        <Text
          fontSize={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 20 : 18}
          weight="medium"
          style={[IS_MOBILE_UP_BENZIN_BREAKPOINT ? { textAlign: 'center' } : { marginLeft: -8 }]}
        >
          Transaction Progress
        </Text>
      </View>

      <View style={styles.network}>
        {activeStep === 'in-progress' ? (
          <Text appearance="tertiaryText" fontSize={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 16 : 14}>
            {/* TODO: FIX estimated time */}
            Est time remaining {network.chainId === 1n ? 1 : 10}{' '}
            {network.chainId === 1n ? 'minute' : 'seconds'}{' '}
          </Text>
        ) : null}
        <Text
          appearance="secondaryText"
          fontSize={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 16 : 14}
          style={IS_MOBILE_UP_BENZIN_BREAKPOINT ? spacings.mrTy : spacings.mrTy}
        >
          on {network.name}
        </Text>
        <NetworkIcon id={network.chainId.toString()} benzinNetwork={network} size={24} />
      </View>
    </>
  )
}

export default Header
