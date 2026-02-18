import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import Button, { Props as CommonButtonProps } from '../Button/Button'
import Spinner from '../Spinner'

type Props = Omit<CommonButtonProps, 'style' | 'children' | 'childrenPosition'> & {
  style?: ViewStyle
  isLoading?: boolean
}

const ButtonWithLoader: FC<Props> = ({ style, isLoading, ...rest }) => {
  const { themeType } = useTheme()

  return (
    <Button
      style={[
        {
          minWidth: 104,
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
          variant="white"
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
