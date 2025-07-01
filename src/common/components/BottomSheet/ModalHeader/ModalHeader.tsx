import React, { FC } from 'react'
import { TouchableOpacity, View, ViewStyle } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import BackButton from '@common/components/BackButton'
import { PanelBackButton } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

interface Props {
  hideLeftSideContainer?: boolean
  hideRightSideContainer?: boolean
  handleClose?: () => void
  withBackButton?: boolean
  title?: string
  titleSuffix?: JSX.Element
  style?: ViewStyle
}

const ModalHeader: FC<Props> = ({
  hideLeftSideContainer = false,
  hideRightSideContainer = false,
  handleClose,
  withBackButton = true,
  title,
  titleSuffix,
  style
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
        <View style={styles.sideContainer}>
          {!!handleClose && !withBackButton && (
            <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
              <CloseIcon />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(ModalHeader)
