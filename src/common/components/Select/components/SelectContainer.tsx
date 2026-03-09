/* eslint-disable react/prop-types */
import React, { FC, ReactNode, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FlatList,
  FlatListProps,
  SectionList,
  SectionListProps,
  TextInput,
  View
} from 'react-native'

import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles, { DEFAULT_SELECT_SIZE } from '../styles'
import { CommonSelectProps, RenderSelectedOptionParams } from '../types'
import useSelectInternal from '../useSelectInternal'
import BottomSheetContainer from './BottomSheetContainer'
import MenuContainer from './MenuContainer'
import SelectedMenuOption from './SelectedMenuOption'

type Props = CommonSelectProps &
  ReturnType<typeof useSelectInternal> & {
    children?: React.ReactNode
    listRef?: React.Ref<any>
    sectionListProps?: SectionListProps<any, any> & { ref?: React.Ref<any> }
    flatListProps?: FlatListProps<any> & { ref?: React.Ref<any> }
    renderHeaderChildren?: ({}: RenderSelectedOptionParams) => ReactNode
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
  mode = isMobile ? 'bottomSheet' : 'select',
  testID,
  renderSelectedOption,
  setIsMenuOpen,
  listRef,
  sectionListProps,
  flatListProps,
  renderHeaderChildren
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
                containerStyle={{
                  ...spacings.mtTy,
                  ...spacings.pbTy,
                  ...spacings.phTy
                }}
              />
            )}
            {sectionListProps ? (
              <SectionList {...sectionListProps} />
            ) : flatListProps ? (
              <FlatList {...flatListProps} />
            ) : (
              children
            )}
            {!!withSearch && menuProps.position === 'top' && (
              <Search
                placeholder={searchPlaceholder || t('Search...')}
                autoFocus
                control={control}
                containerStyle={{
                  ...spacings.mtTy,
                  ...spacings.pbTy,
                  ...spacings.phTy
                }}
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
          contentRef={listRef}
          // There is some issue on web and the sectionListProps
          // rendered directly in the bottom sheet crash the extension
          // so we need to pass the SectinList as a child to the bottom sheet
          sectionListProps={isMobile ? sectionListProps : undefined}
          flatListProps={flatListProps}
          HeaderComponent={
            <View>
              <ModalHeader title={bottomSheetTitle} handleClose={toggleMenu} />
              {renderHeaderChildren?.({ toggleMenu, setIsMenuOpen, isMenuOpen, selectRef })}
              {!!withSearch && (
                <Search
                  placeholder={searchPlaceholder || t('Search...')}
                  autoFocus={false}
                  setInputRef={setInputRef}
                  control={control}
                  containerStyle={spacings.mb}
                />
              )}
            </View>
          }
        >
          {!isMobile && sectionListProps ? <SectionList {...sectionListProps} /> : children}
        </BottomSheetContainer>
      )}
    </View>
  )
}

export default React.memo(SelectContainer)
