import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

import Button, { Props as CommonButtonProps } from '../Button/Button'
import Spinner from '../Spinner'

type Props = Omit<CommonButtonProps, 'style' | 'children' | 'childrenPosition'> & {
  style?: ViewStyle
  isLoading?: boolean
}

const ButtonWithLoader: FC<Props> = ({ style, isLoading, ...rest }) => {
  const { themeType } = useTheme()
  const spinnerVariant = themeType === THEME_TYPES.DARK ? 'black' : 'white'

  return (
    <Button
      style={[
        {
          minWidth: 160,
          ...spacings.mlSm
        },
        isLoading ? spacings.pr0 : {},
        style
      ]}
      hasBottomSpacing={false}
      {...rest}
    >
      {isLoading && (
        <Spinner
          variant={spinnerVariant}
          style={{
            width: 32,
            height: 32
          }}
        />
      )}
    </Button>
  )
}

export default ButtonWithLoader
