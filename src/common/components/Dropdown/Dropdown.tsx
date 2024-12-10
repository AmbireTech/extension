import React, { FC, ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, TextStyle, View } from 'react-native'

import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import colors from '@common/styles/colors'
import common from '@common/styles/utils/common'
import { Portal } from '@gorhom/portal'

import getStyles from './styles'

interface Props {
  data: Array<{ label: string; value: string; style?: TextStyle }>
  onSelect: (item: { label: string; value: string }) => void
}

const Dropdown: FC<Props> = ({ data, onSelect }) => {
  const DropdownButton: any = useRef()
  const [visible, setVisible] = useState(false)
  const { styles } = useTheme(getStyles)
  const dropdownButtonRef = useRef(null)
  const { width: windowWidth } = useWindowSize()
  const modalRef: any = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const prevVisible = usePrevious(visible)

  // close menu on click outside
  useEffect(() => {
    if (!isWeb) return
    function handleClickOutside(event: MouseEvent) {
      if (!visible) return

      if (modalRef.current && !modalRef.current?.contains(event.target)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      if (!isWeb) return
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible])

  useEffect(() => {
    if (!prevVisible && !!visible) {
      // @ts-ignore
      DropdownButton.current.measure((fx, fy, w, h, px, py) => {
        setPosition({ x: px, y: py })
      })
    }
  }, [prevVisible, visible])

  const toggleDropdown = useCallback((): void => {
    setVisible((p) => !p)
  }, [])

  const onItemPress = useCallback(
    (item: any): void => {
      onSelect(item)
      setVisible(false)
    },
    [onSelect]
  )

  const renderItem = ({ item }: any): ReactElement<any, any> => (
    <Pressable onPress={() => onItemPress(item)}>
      {({ hovered }: any) => (
        <View style={[styles.item, hovered && { backgroundColor: colors.titanWhite }]}>
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
      {!!visible && (
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
