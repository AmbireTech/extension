import React, { FC } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

import Button, { Props as CommonButtonProps } from '../Button/Button'
import Spinner from '../Spinner'

type Props = Omit<CommonButtonProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>
  isLoading?: boolean
  icon?: React.ReactNode
}

const ButtonWithLoader: FC<Props> = ({ style, isLoading, icon, ...rest }) => {
  return (
    <Button
      style={[
        {
          minWidth: 104
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
      {!isLoading && icon}
    </Button>
  )
}

export default ButtonWithLoader
