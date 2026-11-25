import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BackHandler,
  FlatList,
  GestureResponderEvent,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  TextStyle,
  View
} from 'react-native'
import { SvgProps } from 'react-native-svg'

import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import AboveSheetsOverlay from '@common/components/AboveSheetsOverlay'
import { openBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import usePressedElementScreenPosition from '@common/components/BottomSheet/usePressedElementScreenPosition'
import FadeInView from '@common/components/FadeInView'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { Portal } from '@gorhom/portal'

import getStyles from './styles'

const DROPDOWN_ITEM_HEIGHT = 40
const VIEWPORT_MARGIN = 8

interface Props {
  kebabIconProps?: SvgProps
  data: Array<{ label: string; value: string; style?: TextStyle }>
  externalPosition?: { x: number; y: number }
  setExternalPosition?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  onSelect: (item: { label: string; value: string }) => void
  testID?: string
}

const Dropdown: FC<Props> = ({
  data,
  externalPosition,
  kebabIconProps = {},
  setExternalPosition,
  onSelect,
  testID
}) => {
  const DropdownButton = useRef(null)
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { width: windowWidth, height: windowHeight } = useWindowSize()
  const modalRef: any = useRef(null)
  const [internalPosition, setInternalPosition] = useState({ x: 0, y: 0 })
  const getPressedElementScreenPosition = usePressedElementScreenPosition()

  const position = useMemo(
    () => externalPosition || internalPosition,
    [internalPosition, externalPosition]
  )
  const setPosition = useCallback(
    (pos: { x: number; y: number }) => {
      if (setExternalPosition) {
        setExternalPosition(pos)
      } else {
        setInternalPosition(pos)
      }
    },
    [setExternalPosition]
  )
  const closeDropdown = useCallback(() => setPosition({ x: 0, y: 0 }), [setPosition])

  const dropdownHeight = useMemo(
    () =>
      Math.max(0, Math.min(data.length * DROPDOWN_ITEM_HEIGHT, windowHeight - VIEWPORT_MARGIN * 2)),
    [data.length, windowHeight]
  )

  const isOpen = useMemo(() => position.x !== 0 || position.y !== 0, [position.x, position.y])

  // Bottom sheets are portalled into the same "global" host with a zIndex of their own, so a
  // dropdown opened from a sheet sits one step above the topmost sheet open at that time.
  // Read non-reactively, or a sheet opened later would move the dropdown above it too.
  const zIndex = useMemo(
    () =>
      isOpen && openBottomSheetsCount.value > 0
        ? BOTTOM_SHEET_Z_INDEX + (openBottomSheetsCount.value - 1) * 2 + 1
        : undefined,
    [isOpen]
  )

  const dropdownTop = useMemo(
    () =>
      Math.min(
        Math.max(VIEWPORT_MARGIN, position.y),
        windowHeight - dropdownHeight - VIEWPORT_MARGIN
      ),
    [dropdownHeight, position.y, windowHeight]
  )

  // close menu on click outside (web)
  useEffect(() => {
    if (!isWeb) return
    function handleClickOutside(event: MouseEvent) {
      if (position.x === 0 && position.y === 0) return
      // A press on the button toggles the menu itself, or this would close it and the press reopen it
      if ((DropdownButton.current as HTMLElement | null)?.contains?.(event.target as Node)) return

      if (modalRef.current && !modalRef.current?.contains(event.target)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => {
      if (!isWeb) return
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [closeDropdown, position])

  // Registered after the listener of the sheet the menu is in, so Android back closes the menu first
  useEffect(() => {
    if (isWeb || !isOpen) return

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDropdown()
      return true
    })

    return () => subscription.remove()
  }, [closeDropdown, isOpen])

  // Not from `measure`, which can't tell where a sheet is on the screen. On web it ignores the CSS
  // transform that places the sheet, and on mobile the sheet is a native view of its own
  const toggleDropdown = useCallback(
    (event: GestureResponderEvent): void => {
      if (position.x !== 0 || position.y !== 0) {
        closeDropdown()
        return
      }

      if (isWeb) {
        // @ts-expect-error the ref is untyped
        DropdownButton.current.measureInWindow((x, y) => setPosition({ x, y }))
        return
      }

      setPosition(getPressedElementScreenPosition(event))
    },
    [closeDropdown, getPressedElementScreenPosition, position, setPosition]
  )

  const onItemPress = useCallback(
    (item: any): void => {
      onSelect(item)
      closeDropdown()
    },
    [closeDropdown, onSelect]
  )

  const renderItem = ({ item }: ListRenderItemInfo<NonNullable<Props['data']>[number]>) => (
    <Pressable onPress={() => onItemPress(item)}>
      {({ hovered }: any) => (
        <View
          style={[
            styles.item,
            hovered && {
              backgroundColor: theme.secondaryBackground
            }
          ]}
        >
          <Text fontSize={14} shouldScale={false} style={item.style}>
            {item.label}
          </Text>
        </View>
      )}
    </Pressable>
  )

  return (
    <>
      <Pressable onPress={toggleDropdown} ref={DropdownButton} testID={testID}>
        {/* The button takes the touch, which its position on mobile is read from */}
        <View style={styles.button} pointerEvents="none">
          <KebabMenuIcon {...kebabIconProps} />
        </View>
      </Pressable>
      {isOpen && (
        <Portal hostName="global">
          {/* Native sheets present in their own window, which a z-index can't draw above */}
          <AboveSheetsOverlay>
            {/* On mobile a tap outside the menu lands here and only closes the menu, as touches in a */}
            {/* native sheet and on its dimmed area never reach the app's own views */}
            {!isWeb && (
              <FadeInView style={StyleSheet.absoluteFill}>
                <Pressable
                  onPress={closeDropdown}
                  style={styles.backdrop}
                  accessibilityLabel={t('Close')}
                />
              </FadeInView>
            )}
            <View
              style={[
                styles.dropdown,
                {
                  right: windowWidth - position.x,
                  top: dropdownTop,
                  zIndex
                }
              ]}
              ref={modalRef}
            >
              <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                style={{ maxHeight: dropdownHeight }}
              />
            </View>
          </AboveSheetsOverlay>
        </Portal>
      )}
    </>
  )
}

export default React.memo(Dropdown)
