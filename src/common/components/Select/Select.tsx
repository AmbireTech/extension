/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FlatList, Image, Pressable, View } from 'react-native'

import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useElementSize from '@common/hooks/useElementSize'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { Portal } from '@gorhom/portal'

import getStyles, { MAX_MENU_HEIGHT, MENU_OPTION_HEIGHT } from './styles'
import { SelectProps, SelectValue } from './types'

const Option = React.memo(({ item }: { item: SelectValue }) => {
  const { styles } = useTheme(getStyles)

  if (!item) return null
  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
      {!!item?.icon && typeof item?.icon !== 'string' && (
        <View style={spacings.mrTy}>{item.icon}</View>
      )}
      {!!item?.icon && typeof item?.icon === 'string' && (
        <Image source={{ uri: item.icon }} style={styles.optionIcon} />
      )}
      {/* The label can be a string or a React component. If it is a string, it will be rendered as a text element. */}
      {typeof item?.label === 'string' ? <Text fontSize={14}>{item.label}</Text> : item?.label}
    </View>
  )
})

const OptionItemToRender = React.memo(
  ({
    item,
    isSelected,
    onPress
  }: {
    item: SelectValue
    isSelected: boolean
    onPress: (item: SelectValue) => void
  }) => {
    const { theme, styles } = useTheme(getStyles)

    return (
      <Pressable
        style={({ hovered }: any) => [
          styles.menuOption,
          isSelected && { backgroundColor: theme.tertiaryBackground },
          hovered && { backgroundColor: theme.secondaryBackground }
        ]}
        onPress={() => onPress(item)}
      >
        <Option item={item} />
      </Pressable>
    )
  }
)

const Select = ({
  label,
  setValue,
  value,
  options,
  placeholder,
  containerStyle,
  selectStyle,
  labelStyle,
  menuStyle,
  disabled,
  withSearch = true
}: SelectProps) => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, styles } = useTheme(getStyles)
  const selectRef = useRef(null)
  const menuRef = useRef(null)
  const { x, y, height, width, forceUpdate } = useElementSize(selectRef)
  const { height: windowHeight } = useWindowSize()
  const { control, watch, setValue: setSearchValue } = useForm({ defaultValues: { search: '' } })

  const search = watch('search')

  const filteredOptions = useMemo(() => {
    if (!search) return options
    return options.filter((o) => {
      let found: boolean = o.value.toString().toLowerCase().includes(search.toLowerCase())
      if (!found && typeof o.label === 'string') {
        found = o.label.toLowerCase().includes(search.toLowerCase())
      }

      return found
    })
  }, [options, search])

  // close menu on click outside
  useEffect(() => {
    if (!isWeb) return
    function handleClickOutside(event: MouseEvent) {
      if (!isMenuOpen) return
      // @ts-ignore
      if (menuRef.current && !menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
        setSearchValue('search', '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      if (!isWeb) return
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen, setSearchValue])

  const handleOptionSelect = useCallback(
    (item: SelectValue) => {
      !!setValue && setValue(item)
      setIsMenuOpen(false)
      setSearchValue('search', '')
    },
    [setValue, setSearchValue]
  )

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: SelectValue }) => (
      <OptionItemToRender
        item={item}
        isSelected={item.value === value.value}
        onPress={handleOptionSelect}
      />
    ),

    [value, handleOptionSelect]
  )

  const handleOpenMenu = useCallback(() => {
    setIsMenuOpen(true)
    forceUpdate() // calculate menu position
  }, [forceUpdate])

  const menuPosition = useMemo(() => {
    if (!!isMenuOpen && y + height + MAX_MENU_HEIGHT > windowHeight && y - MAX_MENU_HEIGHT > 0)
      return 'top'

    return 'bottom'
  }, [height, isMenuOpen, windowHeight, y])

  return (
    <View style={[styles.selectContainer, containerStyle]}>
      {!!label && (
        <Text
          appearance="secondaryText"
          fontSize={14}
          weight="regular"
          style={[spacings.mbMi, labelStyle]}
        >
          {label}
        </Text>
      )}
      <Pressable
        disabled={disabled}
        style={[styles.selectBorderWrapper, isMenuOpen && { borderColor: theme.infoBackground }]}
        onPress={handleOpenMenu}
      >
        <View
          ref={selectRef}
          style={[
            styles.select,
            { borderColor: isMenuOpen ? theme.primary : theme.secondaryBorder },
            selectStyle
          ]}
        >
          {!value && (
            <Text fontSize={14} appearance="secondaryText">
              {placeholder || t('Select...')}
            </Text>
          )}
          {!!value && <Option item={value} />}
        </View>
      </Pressable>
      {!!isMenuOpen && (
        <Portal hostName="global">
          <View style={styles.menuBackdrop}>
            <View
              ref={menuRef}
              style={[
                styles.menuContainer,
                { width, left: x },
                menuPosition === 'bottom' && { top: y + height },
                menuPosition === 'top' && { bottom: windowHeight - y },
                menuStyle
              ]}
            >
              {!!withSearch && menuPosition === 'bottom' && (
                <Search
                  placeholder={t('Search...')}
                  autoFocus
                  control={control}
                  containerStyle={spacings.mb0}
                  borderWrapperStyle={{ borderWidth: 0, borderRadius: 0 }}
                  inputWrapperStyle={{
                    borderWidth: 0,
                    borderBottomWidth: 1,
                    borderRadius: 0,
                    borderColor: theme.secondaryBorder
                  }}
                />
              )}
              <FlatList
                data={filteredOptions}
                renderItem={renderItem}
                keyExtractor={(item) => item.value.toString()}
                initialNumToRender={15}
                windowSize={10}
                maxToRenderPerBatch={20}
                removeClippedSubviews
                getItemLayout={(data, index) => ({
                  length: MENU_OPTION_HEIGHT,
                  offset: MENU_OPTION_HEIGHT * index,
                  index
                })}
                ListEmptyComponent={
                  <Text
                    style={[spacings.pv, flexbox.flex1, text.center]}
                    numberOfLines={1}
                    appearance="secondaryText"
                    fontSize={14}
                  >
                    {t('No items found')}
                  </Text>
                }
              />
              {!!withSearch && menuPosition === 'top' && (
                <Search
                  placeholder={t('Search...')}
                  autoFocus
                  control={control}
                  containerStyle={spacings.mb0}
                  borderWrapperStyle={{ borderWidth: 0, borderRadius: 0 }}
                  inputWrapperStyle={{
                    borderWidth: 0,
                    borderTopWidth: 1,
                    borderBottomWidth: 0,
                    borderRadius: 0,
                    borderColor: theme.secondaryBorder
                  }}
                />
              )}
            </View>
          </View>
        </Portal>
      )}
    </View>
  )
}

export default React.memo(Select)
