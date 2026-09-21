import React from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import AmbireLogoHorizontalMonochrome from '@common/assets/svg/AmbireLogoHorizontalMonochrome'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'

import styles, { CONFETTI_HEIGHT, CONFETTI_WIDTH } from './styles'
import ToggleOG from './ToggleOG'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  withOG?: boolean
}

const selectIsOG = (state: AllControllersMappingType['InviteController']) => state.isOG

const AmbireLogoHorizontalWithOG: React.FC<Props & SvgProps> = ({ withOG, ...rest }) => {
  const { state: isOG } = useController('InviteController', selectIsOG)
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
