import React, { FC } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { StepsData } from '@benzin/screens/BenzinScreen/hooks/useSteps'
import { ActiveStepType } from '@benzin/screens/BenzinScreen/interfaces/steps'
import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  activeStep: ActiveStepType
  network: Network
  stepsState: StepsData
}

const Header: FC<Props> = ({ activeStep, network, stepsState }) => {
  const { styles } = useTheme(getStyles)
  const { pendingTime } = stepsState

  return (
    <>
      <View
        style={[
          IS_MOBILE_UP_BENZIN_BREAKPOINT
            ? {}
            : { flexDirection: 'row-reverse', ...flexbox.justifySpaceBetween },
          IS_MOBILE_UP_BENZIN_BREAKPOINT ? {} : spacings.mbXl,
          flexbox.alignCenter
        ]}
      >
        <View style={styles.logoWrapper}>
          <AmbireLogoHorizontal
            width={165 / (IS_MOBILE_UP_BENZIN_BREAKPOINT ? 1 : 1.8)}
            height={56 / (IS_MOBILE_UP_BENZIN_BREAKPOINT ? 1 : 1.8)}
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
          <Text appearance="secondaryText" fontSize={14}>
            {/* TODO: FIX estimated time */}
            Est time remaining {pendingTime === 30 ? 30 : 5}{' '}
            {pendingTime === 30 ? 'seconds' : 'minutes'}{' '}
          </Text>
        ) : null}
        <Text appearance="secondaryText" fontSize={14}>
          on{' '}
        </Text>
        <NetworkIcon
          id={network.chainId.toString()}
          style={spacings.mrMi}
          benzinNetwork={network}
        />
        <Text testID="network-name" appearance="secondaryText" fontSize={14}>
          {network.name}
        </Text>
      </View>
    </>
  )
}

export default Header
