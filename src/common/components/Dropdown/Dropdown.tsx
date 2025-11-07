import React, { FC, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, TextStyle, View } from 'react-native'

import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { Portal } from '@gorhom/portal'

import getStyles from './styles'

interface Props {
  data: Array<{ label: string; value: string; style?: TextStyle }>
  externalPosition?: { x: number; y: number }
  setExternalPosition?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  onSelect: (item: { label: string; value: string }) => void
}

const Dropdown: FC<Props> = ({ data, externalPosition, setExternalPosition, onSelect }) => {
  const DropdownButton: any = useRef()
  const { styles, theme, themeType } = useTheme(getStyles)
  const dropdownButtonRef = useRef(null)
  const { width: windowWidth } = useWindowSize()
  const modalRef: any = useRef(null)
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

  // close menu on click outside
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

  const renderItem = ({ item }: any): ReactElement<any, any> => (
    <Pressable onPress={() => onItemPress(item)}>
      {({ hovered }: any) => (
        <View
          style={[
            styles.item,
            hovered && {
              backgroundColor:
                themeType === THEME_TYPES.DARK
                  ? theme.tertiaryBackground
                  : theme.secondaryBackground
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
      <View ref={dropdownButtonRef}>
        <Pressable onPress={toggleDropdown} ref={DropdownButton}>
          <View style={styles.button}>
            <KebabMenuIcon />
          </View>
        </Pressable>
      </View>
      {!!position.x && !!position.y && (
        <Portal hostName="global">
          <View
            style={[
              styles.dropdown,
              {
                right: windowWidth - position.x,
                top: position.y
              }
            ]}
            ref={modalRef}
          >
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={(_, index) => index.toString()}
            />
          </View>
        </Portal>
      )}
    </>
  )
}

export default React.memo(Dropdown)
