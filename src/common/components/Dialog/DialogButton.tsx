import { ViewStyle } from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import { isMobile, isWeb } from '@common/config/env'

type Props = ButtonProps &
  Required<Pick<ButtonProps, 'text' | 'type'>> & {
    style?: ViewStyle
  }

const DialogButton = ({ style, ...rest }: Props) => (
  <Button
    {...rest}
    hasBottomSpacing={false}
    style={
      isWeb
        ? {
            ...(style || {}),
            minWidth: 120
          }
        : {
            height: 52,
            ...(style || {})
          }
    }
    size={isMobile ? 'regular' : 'small'}
  />
)

export default DialogButton
