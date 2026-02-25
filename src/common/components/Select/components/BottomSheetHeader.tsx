/* eslint-disable react/prop-types */
import React, { FC } from 'react'
import { View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import getStyles from '@common/components/Select/styles'
import Text from '@common/components/Text'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { RenderSelectedOptionParams, SelectProps } from '../types'

type Props = Pick<SelectProps, 'label'> & Pick<RenderSelectedOptionParams, 'toggleMenu'>

const BottomSheetHeader: FC<Props> = ({ label, toggleMenu }) => {
  const { theme } = useTheme(getStyles)
  const [bindCloseBtnAnim, closeBtnAnimStyle] = useHover({ preset: 'opacityInverted' })

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.pvLg,
        spacings.phLg,
        { backgroundColor: theme.secondaryBackground }
      ]}
    >
      <Text fontSize={20} weight="medium">
        {label}
      </Text>
      <AnimatedPressable
        style={[
          closeBtnAnimStyle,
          flexbox.center,
          {
            width: 40,
            height: 40
          }
        ]}
        {...bindCloseBtnAnim}
        onPress={toggleMenu}
      >
        <CloseIcon />
      </AnimatedPressable>
    </View>
  )
}

export default React.memo(BottomSheetHeader)
