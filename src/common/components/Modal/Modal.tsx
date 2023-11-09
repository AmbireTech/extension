import React, { ReactElement } from 'react'
import { Modal as RNModal, Pressable, TouchableOpacity, View, ViewStyle } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'

import BackButton from '../BackButton'
import getStyles from './styles'

type Props = {
  isOpen: boolean
  onClose?: () => void
  title?: string
  modalStyle?: ViewStyle | ViewStyle[]
  children: ReactElement | ReactElement[]
  withBackButton?: boolean
}

const Modal = ({ isOpen, onClose, title, modalStyle, children, withBackButton }: Props) => {
  const { styles } = useTheme(getStyles)

  return (
    <RNModal animationType="fade" transparent visible={isOpen} onRequestClose={onClose}>
      <Pressable
        onPress={() => !!onClose && onClose()}
        // @ts-ignore
        style={[styles.container, !onClose && isWeb ? { cursor: 'default' } : {}]}
      >
        <Pressable style={[styles.modal, modalStyle]}>
          <View style={styles.modalHeader}>
            <View style={styles.sideContainer}>
              {!!onClose && withBackButton && (
                <View style={styles.backButton}>
                  <BackButton onPress={onClose} />
                </View>
              )}
            </View>
            {!!title && (
              <Text fontSize={20} weight="medium">
                {title}
              </Text>
            )}
            <View style={styles.sideContainer}>
              {!!onClose && !withBackButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                  <CloseIcon />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  )
}

export default Modal
