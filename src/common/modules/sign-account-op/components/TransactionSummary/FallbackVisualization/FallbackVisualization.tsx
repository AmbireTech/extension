/* eslint-disable react/no-array-index-key */
import { formatUnits } from 'ethers'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import Text from '@common/components/Text'
import { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  call: IrCall
  sizeMultiplierSize: number
  textSize: number
  hasPadding?: boolean
}

const FallbackVisualization: FC<Props> = ({
  call,
  sizeMultiplierSize,
  textSize,
  hasPadding = true
}) => {
  const { t } = useTranslation()

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.wrap,
        {
          paddingHorizontal: hasPadding ? SPACING_SM * sizeMultiplierSize : 0
        }
      ]}
    >
      {call.to && (
        <>
          <Text
            fontSize={textSize}
            appearance="successText"
            weight="semiBold"
            style={{ maxWidth: '100%' }}
          >
            {t(' Interacting with (to): ')}
          </Text>
          <Text
            fontSize={textSize}
            appearance="secondaryText"
            weight="regular"
            style={{ maxWidth: '100%' }}
            selectable
          >
            {` ${call.to} `}
          </Text>
        </>
      )}
      <Text
        fontSize={textSize}
        appearance="successText"
        weight="semiBold"
        style={{ maxWidth: '100%' }}
      >
        {t(' Value to be sent (value): ')}
      </Text>
      <Text selectable fontSize={textSize} appearance="secondaryText" weight="regular">
        {` ${formatUnits(call.value || '0x0', 18)} `}
      </Text>
    </View>
  )
}

export default FallbackVisualization
