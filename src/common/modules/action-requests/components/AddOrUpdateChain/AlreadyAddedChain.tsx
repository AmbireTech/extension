import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type AlreadyAddedChainProps = {
  networkAlreadyAdded: Network
  successStateText: string
}

const AlreadyAddedChain = ({ networkAlreadyAdded, successStateText }: AlreadyAddedChainProps) => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={[flexbox.flex1, flexbox.alignCenter, isWeb && spacings.mt2Xl]}>
      <View
        style={[
          common.borderRadiusPrimary,
          {
            width: '100%',
            ...spacings.phXl,
            maxWidth: 420,
            ...spacings.pv3Xl,
            ...flexbox.center,
            backgroundColor: theme.secondaryBackground
          }
        ]}
      >
        <SuccessAnimation style={spacings.mbLg} size={96} />
        <Text fontSize={20} weight="medium" style={spacings.mb}>
          {networkAlreadyAdded.name} {t('Network')}
        </Text>
        <Text fontSize={15} appearance="secondaryText">
          {successStateText}
        </Text>
      </View>
    </View>
  )
}
export default React.memo(AlreadyAddedChain)
