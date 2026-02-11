import React from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import AmbireLogoHorizontalMonochrome from '@common/assets/svg/AmbireLogoHorizontalMonochrome'
import usePrevious from '@common/hooks/usePrevious'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
import useInviteControllerState from '@web/hooks/useInviteControllerState'

import styles, { CONFETTI_HEIGHT, CONFETTI_WIDTH } from './styles'
import ToggleOG from './ToggleOG'

type Props = {
  withOG?: boolean
}

const AmbireLogoHorizontalWithOG: React.FC<Props & SvgProps> = ({ withOG, ...rest }) => {
  const { isOG } = useInviteControllerState()
  const prevIsOG = usePrevious(isOG)

  const hasJustBecomeOG = prevIsOG !== undefined && isOG && !prevIsOG

  if (!withOG) {
    return <AmbireLogoHorizontalMonochrome {...rest} />
  }

  return (
    <>
      <ToggleOG {...rest} />
      {hasJustBecomeOG && (
        <View style={styles.confettiContainer}>
          <ConfettiAnimation width={CONFETTI_WIDTH} height={CONFETTI_HEIGHT} autoPlay={false} />
        </View>
      )}
    </>
  )
}

export default React.memo(AmbireLogoHorizontalWithOG)
