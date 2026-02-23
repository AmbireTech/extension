import React, { useCallback, useState } from 'react'
import { Pressable } from 'react-native'
import { SvgProps } from 'react-native-svg'

import AmbireLogoHorizontalMonochrome from '@common/assets/svg/AmbireLogoHorizontalMonochrome'
import useController from '@common/hooks/useController'

import styles from './styles'

const PRESS_THRESHOLD = 7

const ToggleOG: React.FC<SvgProps> = ({ ...rest }) => {
  const {
    state: { isOG },
    dispatch: inviteDispatch
  } = useController('InviteController')
  const [, setPressCount] = useState(0)

  const toggleOG = useCallback(() => {
    if (isOG) {
      inviteDispatch({
        type: 'method',
        params: {
          method: 'becomeOG',
          args: []
        }
      })
    } else {
      inviteDispatch({
        type: 'method',
        params: {
          method: 'revokeOG',
          args: []
        }
      })
    }
  }, [inviteDispatch, isOG])

  const handlePress = useCallback(() => {
    setPressCount((prevCount) => {
      const nextCount = prevCount + 1
      if (nextCount === PRESS_THRESHOLD) {
        toggleOG()
        return 0 // reset count
      }

      return nextCount
    })
  }, [toggleOG])

  return (
    <Pressable style={styles.pressable} onPress={handlePress}>
      <AmbireLogoHorizontalMonochrome {...rest} isOG={isOG} />
    </Pressable>
  )
}

export default React.memo(ToggleOG)
