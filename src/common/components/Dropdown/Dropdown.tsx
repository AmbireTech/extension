import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  GestureResponderEvent,
  ListRenderItemInfo,
  Pressable,
  TextStyle,
  View
} from 'react-native'
import { SvgProps } from 'react-native-svg'

import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import AboveSheetsOverlay from '@common/components/AboveSheetsOverlay'
import { openBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import usePressedElementScreenPosition from '@common/components/BottomSheet/usePressedElementScreenPosition'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { Portal } from '@gorhom/portal'

import { registerDropdownDismiss, unregisterDropdownDismiss } from './dropdownDismissManager'
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
  const { width: windowWidth, height: windowHeight } = useWindowSize()
  const modalRef: any = useRef(null)
  const touchStartedInsideRef = useRef(false)
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
        setPosition({ x: 0, y: 0 })
      }
    }
    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => {
      if (!isWeb) return
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [setPosition, position])

  // close menu on touch outside (mobile)
  useEffect(() => {
    if (isWeb || !isOpen) return

    // The tap that opened the dropdown raised the flag while there was nothing registered to
    // consume it, so clear it here or the first tap outside would be spent on it
    touchStartedInsideRef.current = false

    // The touch is observed on the app root, which cannot tell where it landed, so the dropdown and
    // its button flag their own touches on the way up and this only closes when no flag was raised
    const dismissCheck = () => {
      const startedInside = touchStartedInsideRef.current
      touchStartedInsideRef.current = false

      if (!startedInside) setPosition({ x: 0, y: 0 })
    }

    registerDropdownDismiss(dismissCheck)

    return () => unregisterDropdownDismiss(dismissCheck)
  }, [isOpen, setPosition])

  const flagTouchStartedInside = useCallback((): void => {
    touchStartedInsideRef.current = true
  }, [])

  // Not from `measure`, which can't tell where a sheet is on the screen. On web it ignores the CSS
  // transform that places the sheet, and on mobile the sheet is a native view of its own
  const toggleDropdown = useCallback(
    (event: GestureResponderEvent): void => {
      if (position.x !== 0 || position.y !== 0) {
        setPosition({ x: 0, y: 0 })
        return
      }

      if (isWeb) {
        // @ts-expect-error the ref is untyped
        DropdownButton.current.measureInWindow((x, y) => setPosition({ x, y }))
        return
      }

      setPosition(getPressedElementScreenPosition(event))
    },
    [getPressedElementScreenPosition, position, setPosition]
  )

  const onItemPress = useCallback(
    (item: any): void => {
      onSelect(item)
      setPosition({ x: 0, y: 0 })
    },
    [onSelect, setPosition]
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
      <View onTouchStart={flagTouchStartedInside}>
        <Pressable onPress={toggleDropdown} ref={DropdownButton} testID={testID}>
          {/* The button takes the touch, which its position on mobile is read from */}
          <View style={styles.button} pointerEvents="none">
            <KebabMenuIcon {...kebabIconProps} />
          </View>
        </Pressable>
      </View>
      {isOpen && (
        <Portal hostName="global">
          {/* Native sheets present in their own window, which a z-index can't draw above */}
          <AboveSheetsOverlay>
            <View
              onTouchStart={flagTouchStartedInside}
              style={[
                styles.dropdown,
                {
                  right: windowWidth - position.x,
                  top: dropdownTop,
                  maxHeight: dropdownHeight,
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
