import React from 'react'
import { View, ViewProps } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import NoEntryIcon from '@common/assets/svg/NoEntryIcon/NoEntryIcon'
import useTheme from '@common/hooks/useTheme'
import { default as flexbox } from '@common/styles/utils/flexbox'

import Spinner from '../Spinner'
import getStyles from './styles'

interface Props {
  children?: any
  style?: ViewProps['style']
  isDisabled?: boolean
  hasSigned?: boolean
  isQueued?: boolean
}

const SafeKeyWrapper = ({ children, style, isDisabled, hasSigned, isQueued }: Props) => {
  const { theme, styles } = useTheme(getStyles)

  return (
    <View
      style={[style, flexbox.directionRow, flexbox.alignCenter, isDisabled && { opacity: 0.6 }]}
    >
      <View style={flexbox.flex1}>{children}</View>
      {(!isDisabled || hasSigned) && (
        <CheckIcon
          color={hasSigned ? theme.success300 : theme.secondaryText}
          checkColor={theme.neutral600}
          style={styles.icon}
          width={18}
          height={18}
        />
      )}
      {!isQueued && isDisabled && !hasSigned && (
        <NoEntryIcon width={17} height={17} style={styles.icon} />
      )}
      {isQueued && isDisabled && !hasSigned && (
        <Spinner style={{ width: 17, height: 17, ...styles.icon }} />
      )}
    </View>
  )
}

export default React.memo(SafeKeyWrapper)
