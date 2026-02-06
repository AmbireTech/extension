import React, { useCallback, useState } from 'react'
import { Pressable } from 'react-native'
import { SvgProps } from 'react-native-svg'

import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useInviteControllerState from '@web/hooks/useInviteControllerState'

import AmbireLogoHorizontal from '../AmbireLogoHorizontal/AmbireLogoHorizontal'
import AmbireLogoHorizontalOG from './AmbireLogoHorizontalOG'
import styles from './styles'

const PRESS_THRESHOLD = 7

const ToggleOG: React.FC<SvgProps> = ({ ...rest }) => {
  const { dispatch } = useControllersMiddleware()
  const { isOG } = useInviteControllerState()
  const [, setPressCount] = useState(0)

  const toggleOG = useCallback(() => {
    dispatch({
      type: isOG ? 'INVITE_CONTROLLER_REVOKE_OG' : 'INVITE_CONTROLLER_BECOME_OG'
    })
  }, [dispatch, isOG])

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
      {isOG ? <AmbireLogoHorizontalOG {...rest} /> : <AmbireLogoHorizontal {...rest} />}
    </Pressable>
  )
}

export default React.memo(ToggleOG)
