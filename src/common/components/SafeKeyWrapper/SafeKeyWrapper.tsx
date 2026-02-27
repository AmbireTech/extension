import React from 'react'
import { View, ViewProps } from 'react-native'

import CheckIcon2 from '@common/assets/svg/CheckIcon2'
import NoEntryIcon from '@common/assets/svg/NoEntryIcon/NoEntryIcon'
import useTheme from '@common/hooks/useTheme'
import { default as flexbox } from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  children?: any
  style?: ViewProps['style']
  isDisabled?: boolean
  hasSigned?: boolean
}

const SafeKeyWrapper = ({ children, style, isDisabled, hasSigned }: Props) => {
  const { theme, styles } = useTheme(getStyles)

  return (
    <View
      style={[style, flexbox.directionRow, flexbox.alignCenter, isDisabled && { opacity: 0.6 }]}
    >
      <View style={flexbox.flex1}>{children}</View>
      {(!isDisabled || hasSigned) && (
        <CheckIcon2
          color={hasSigned ? theme.success400 : theme.secondaryText}
          checkColor={theme.neutral100}
          style={styles.icon}
          width={17}
          height={17}
        />
      )}
      {isDisabled && !hasSigned && <NoEntryIcon width={17} height={17} style={styles.icon} />}
    </View>
  )
}

export default React.memo(SafeKeyWrapper)
