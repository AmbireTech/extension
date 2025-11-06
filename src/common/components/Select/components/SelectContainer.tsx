/* eslint-disable react/prop-types */
import React, { FC, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, View } from 'react-native'

import Search from '@common/components/Search'
import BottomSheetHeader from '@common/components/Select/components/BottomSheetHeader'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles, { DEFAULT_SELECT_SIZE } from '../styles'
import { CommonSelectProps } from '../types'
import useSelectInternal from '../useSelectInternal'
import BottomSheetContainer from './BottomSheetContainer'
import MenuContainer from './MenuContainer'
import SelectedMenuOption from './SelectedMenuOption'

type Props = CommonSelectProps &
  ReturnType<typeof useSelectInternal> & {
    children: React.ReactNode
  }

const SelectContainer: FC<Props> = ({
  id,
  label,
  bottomSheetTitle,
  value,
  clearValue,
  placeholder,
  containerStyle,
  selectBorderWrapperStyle,
  selectStyle,
  hoveredSelectStyle,
  labelStyle,
  menuStyle,
  disabled,
  withSearch = true,
  withClearButton,
  searchPlaceholder,
  isMenuOpen,
  selectRef,
  menuProps,
  menuLeftHorizontalOffset,
  menuRef,
  toggleMenu,
  control,
  children,
  size = DEFAULT_SELECT_SIZE,
  mode = 'select',
  testID,
  renderSelectedOption,
  setIsMenuOpen
}) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const searchInputRef = useRef<TextInput | null>(null)

  const setInputRef = useCallback((ref: TextInput | null) => {
    if (ref) searchInputRef.current = ref
  }, [])

  // Workaround for auto-focusing the Search input when it's rendered inside the BottomSheet.
  // If we try to enable it via the <Search autoFocus /> prop, a layout shift occurs beneath the BottomSheet.
  // This is most likely due to the BottomSheet's absolute positioning - when it starts opening,
  // it's positioned outside of the viewport along with the Search input.
  useEffect(() => {
    if (isMenuOpen && mode === 'bottomSheet') {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 300)
    }
  }, [isMenuOpen, mode])

  return (
    <View style={[styles.selectContainer, containerStyle]} testID={testID}>
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
      {renderSelectedOption ? (
        renderSelectedOption({ toggleMenu, setIsMenuOpen, isMenuOpen, selectRef })
      ) : (
        <SelectedMenuOption
          disabled={disabled}
          clearValue={clearValue}
          isMenuOpen={isMenuOpen}
          selectRef={selectRef}
          toggleMenu={toggleMenu}
          value={value}
          withClearButton={withClearButton}
          placeholder={placeholder}
          selectBorderWrapperStyle={selectBorderWrapperStyle}
          selectStyle={selectStyle}
          hoveredSelectStyle={hoveredSelectStyle}
          size={size}
        />
      )}

      {mode === 'select' ? (
        isMenuOpen && (
          <MenuContainer
            menuRef={menuRef}
            menuStyle={menuStyle}
            menuProps={menuProps}
            menuLeftHorizontalOffset={menuLeftHorizontalOffset}
          >
            {!!withSearch && menuProps.position === 'bottom' && (
              <Search
                placeholder={searchPlaceholder || t('Search...')}
                autoFocus
                control={control}
                containerStyle={spacings.mb0}
                borderWrapperStyle={styles.searchBorderWrapperStyle}
                inputWrapperStyle={styles.bottomSearchInputWrapperStyle}
                leftIconStyle={spacings.pl}
              />
            )}
            {children}
            {!!withSearch && menuProps.position === 'top' && (
              <Search
                placeholder={searchPlaceholder || t('Search...')}
                autoFocus
                control={control}
                containerStyle={spacings.mb0}
                borderWrapperStyle={styles.searchBorderWrapperStyle}
                inputWrapperStyle={styles.topSearchInputWrapperStyle}
                leftIconStyle={spacings.pl}
              />
            )}
          </MenuContainer>
        )
      ) : (
        <BottomSheetContainer
          id={id}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          toggleMenu={toggleMenu}
        >
          <BottomSheetHeader label={bottomSheetTitle} toggleMenu={toggleMenu} />
          <View style={[spacings.phMd, spacings.pvMd, flexbox.flex1, { height: 600 }]}>
            <Search
              placeholder={searchPlaceholder || t('Search...')}
              // When autoFocus is enabled, the BottomSheet animation breaks.
              // See the useEffect above for more details — it manually focuses the Search input.
              autoFocus={false}
              setInputRef={setInputRef}
              control={control}
              containerStyle={spacings.mb}
              leftIconStyle={spacings.pl}
              height={48}
            />
            {children}
          </View>
        </BottomSheetContainer>
      )}
    </View>
  )
}

export default React.memo(SelectContainer)
