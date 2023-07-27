import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, TextStyle, View, ViewStyle } from 'react-native'
import { Modalize, ModalizeProps } from 'react-native-modalize'

import Button from '@common/components/Button'
import { isWeb } from '@common/config/env'
import { HEADER_HEIGHT } from '@common/modules/header/components/Header/styles'
import { DEVICE_HEIGHT } from '@common/styles/spacings'
import { Portal } from '@gorhom/portal'

import Backdrop from './Backdrop'
import styles from './styles'

interface Props {
  id?: string
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: (dest?: 'alwaysOpen' | 'default' | undefined) => void
  onBackdropPress?: () => void
  onClosed?: () => void
  children?: React.ReactNode
  // Preferences
  cancelText?: string
  cancelTextStyles?: TextStyle
  cancelOnPress?: () => void
  displayCancel?: boolean
  adjustToContentHeight?: boolean
  style?: ViewStyle
  flatListProps?: ModalizeProps['flatListProps']
  withOverlay?: boolean
}

const ANIMATION_DURATION: number = 250

const BottomSheet: React.FC<Props> = ({
  // Useful for debugging and generally knowing which bottom sheet is triggered
  // eslint-disable-next-line
  id,
  sheetRef,
  children,
  displayCancel = true,
  cancelText: _cancelText,
  cancelTextStyles = {},
  cancelOnPress,
  closeBottomSheet = () => {},
  adjustToContentHeight = !isWeb,
  style = {},
  onClosed,
  onBackdropPress,
  flatListProps,
  withOverlay = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const prevIsOpen = usePrevious(isOpen)
  const [isBackdropVisible, setIsBackdropVisible] = useState(false)

  const { t } = useTranslation()

  useEffect(() => {
    if (prevIsOpen && !isOpen) {
      setTimeout(() => {
        // Delays the backdrop unmounting because of the closing animation duration
        setIsBackdropVisible(false)
      }, ANIMATION_DURATION)
    }
  }, [isOpen, prevIsOpen])

  // Hook up the back button (or action) to close the bottom sheet
  useEffect(() => {
    if (!isOpen) return

    const backAction = () => {
      if (isOpen) {
        closeBottomSheet()
        // Returning true prevents execution of the default native back handling
        return true
      }

      return false
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [closeBottomSheet, isOpen])

  return (
    <Portal hostName="global">
      {isBackdropVisible && (
        <Backdrop
          isVisible={isBackdropVisible}
          isBottomSheetVisible={isOpen}
          onPress={() => {
            if (onBackdropPress) {
              onBackdropPress()
            } else {
              closeBottomSheet()
            }
          }}
        />
      )}
      <Modalize
        ref={sheetRef}
        modalStyle={[styles.bottomSheet, style]}
        rootStyle={styles.root}
        handleStyle={styles.dragger}
        handlePosition="inside"
        useNativeDriver={!isWeb}
        avoidKeyboardLikeIOS
        {...(!isWeb ? { modalTopOffset: HEADER_HEIGHT + 10 } : {})}
        {...(isWeb ? { modalHeight: DEVICE_HEIGHT - HEADER_HEIGHT - 10 } : {})}
        threshold={100}
        adjustToContentHeight={adjustToContentHeight}
        disableScrollIfPossible={false}
        withOverlay={withOverlay}
        onBackButtonPress={() => true}
        {...(!flatListProps
          ? {
              scrollViewProps: {
                bounces: false,
                keyboardShouldPersistTaps: 'handled'
              }
            }
          : {})}
        {...(flatListProps
          ? {
              flatListProps: {
                bounces: false,
                keyboardShouldPersistTaps: 'handled',
                contentContainerStyle: styles.containerInnerWrapper,
                ...flatListProps
              }
            }
          : {})}
        openAnimationConfig={{
          timing: { duration: ANIMATION_DURATION, delay: 0 }
        }}
        closeAnimationConfig={{
          timing: { duration: ANIMATION_DURATION, delay: 0 }
        }}
        onOpen={() => {
          setIsOpen(true)
          setIsBackdropVisible(true)
        }}
        onClose={() => setIsOpen(false)}
        onClosed={() => !!onClosed && onClosed()}
      >
        {!flatListProps && (
          <View style={styles.containerInnerWrapper}>
            {children}
            {displayCancel && (
              <Button
                type="ghost"
                onPress={cancelOnPress || closeBottomSheet}
                style={[styles.cancelBtn]}
                textStyle={cancelTextStyles}
                text={_cancelText || (t('Cancel') as string)}
                hitSlop={{ top: 15, bottom: 15 }}
              />
            )}
          </View>
        )}
      </Modalize>
    </Portal>
  )
}

export default React.memo(BottomSheet)
