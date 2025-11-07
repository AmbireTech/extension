import React, { FC } from 'react'
import { TouchableOpacity, View, ViewStyle } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import { PanelBackButton } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  hideLeftSideContainer?: boolean
  hideRightSideContainer?: boolean
  handleClose?: () => void
  withBackButton?: boolean
  title?: string
  titleSuffix?: JSX.Element
  style?: ViewStyle
  hasAmbireLogo?: boolean
}

const ModalHeader: FC<Props> = ({
  hideLeftSideContainer = false,
  hideRightSideContainer = false,
  handleClose,
  withBackButton = true,
  title,
  titleSuffix,
  style,
  hasAmbireLogo = false
}) => {
  const styles = getStyles()

  return (
    <View style={[styles.modalHeader, style]}>
      {!hideLeftSideContainer && (
        <View style={styles.sideContainer}>
          {!!handleClose && withBackButton && (
            <View style={styles.backButton}>
              <PanelBackButton onPress={handleClose} />
            </View>
          )}
        </View>
      )}
      {!!title && (
        <Text fontSize={20} weight="medium" style={!!titleSuffix && spacings.mrSm}>
          {title}
        </Text>
      )}
      {titleSuffix}
      {!hideRightSideContainer && (
        <View
          style={[
            styles.rightSideContainer,
            ...[
              hasAmbireLogo && !!handleClose && !withBackButton
                ? flexbox.justifySpaceBetween
                : flexbox.justifyEnd
            ]
          ]}
        >
          {hasAmbireLogo && <AmbireLogoHorizontal />}
          {!!handleClose && !withBackButton && (
            <TouchableOpacity onPress={handleClose}>
              <CloseIcon />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(ModalHeader)
