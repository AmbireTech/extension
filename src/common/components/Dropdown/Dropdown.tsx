import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, ListRenderItemInfo, Pressable, TextStyle, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
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
}

const Dropdown: FC<Props> = ({
  data,
  externalPosition,
  kebabIconProps = {},
  setExternalPosition,
  onSelect
}) => {
  const DropdownButton = useRef(null)
  const { styles, theme } = useTheme(getStyles)
  const { width: windowWidth, height: windowHeight } = useWindowSize()
  const modalRef: any = useRef(null)
  const dropdownBoundsRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const [internalPosition, setInternalPosition] = useState({ x: 0, y: 0 })

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

    registerDropdownDismiss((touchX, touchY) => {
      const { x, y, width, height } = dropdownBoundsRef.current
      const isInsideDropdown =
        touchX >= x && touchX <= x + width && touchY >= y && touchY <= y + height

      if (!isInsideDropdown) {
        setPosition({ x: 0, y: 0 })
      }
    })

    return () => unregisterDropdownDismiss()
  }, [isOpen, setPosition])

  const toggleDropdown = useCallback((): void => {
    if (position.x === 0 && position.y === 0) {
      // @ts-ignore
      DropdownButton.current.measure((fx, fy, w, h, px, py) => {
        setPosition({ x: px, y: py })
      })
    } else {
      setPosition({ x: 0, y: 0 })
    }
  }, [position, setPosition])

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
      <View>
        <Pressable onPress={toggleDropdown} ref={DropdownButton}>
          <View style={styles.button}>
            <KebabMenuIcon {...kebabIconProps} />
          </View>
        </Pressable>
      </View>
      {isOpen && (
        <Portal hostName="global">
          <View
            style={[
              styles.dropdown,
              {
                right: windowWidth - position.x,
                top: dropdownTop,
                maxHeight: dropdownHeight
              }
            ]}
            ref={modalRef}
            onLayout={() => {
              modalRef.current?.measureInWindow(
                (x: number, y: number, width: number, height: number) => {
                  dropdownBoundsRef.current = { x, y, width, height }
                }
              )
            }}
          >
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={(_, index) => index.toString()}
              style={{ maxHeight: dropdownHeight }}
            />
          </View>
        </Portal>
      )}
    </>
  )
}

export default React.memo(Dropdown)
