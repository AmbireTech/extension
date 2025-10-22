import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

import Button, { Props as CommonButtonProps } from '../Button/Button'
import Spinner from '../Spinner'

type Props = Omit<CommonButtonProps, 'style' | 'children' | 'childrenPosition'> & {
  style?: ViewStyle
  isLoading?: boolean
}

const ButtonWithLoader: FC<Props> = ({ style, isLoading, ...rest }) => {
  return (
    <Button
      style={[
        {
          minWidth: 160,
          ...spacings.mlLg
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
