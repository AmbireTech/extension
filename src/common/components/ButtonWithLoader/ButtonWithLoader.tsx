import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import spacings, { SPACING_TY, SPACING_XL } from '@common/styles/spacings'

import Button, { Props as CommonButtonProps } from '../Button/Button'
import Spinner from '../Spinner'

type Props = Omit<CommonButtonProps, 'style' | 'children' | 'childrenPosition'> & {
  style?: ViewStyle
  isLoading?: boolean
}

const ButtonWithLoader: FC<Props> = ({
  style,
  isLoading,
  childrenContainerStyle = {},
  ...rest
}) => {
  return (
    <Button
      style={[
        {
          minWidth: 160,
          ...spacings.mlLg
        },
        style
      ]}
      hasBottomSpacing={false}
      childrenContainerStyle={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: SPACING_TY,
        ...childrenContainerStyle
      }}
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
