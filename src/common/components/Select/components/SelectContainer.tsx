/* eslint-disable react/prop-types */
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from '../styles'
import { CommonSelectProps } from '../types'
import useSelectInternal from '../useSelectInternal'
import MenuContainer from './MenuContainer'
import SelectedMenuOption from './SelectedMenuOption'

type Props = CommonSelectProps &
  ReturnType<typeof useSelectInternal> & {
    children: React.ReactNode
  }

const SelectContainer: FC<Props> = ({
  label,
  value,
  placeholder,
  containerStyle,
  selectStyle,
  labelStyle,
  menuStyle,
  disabled,
  withSearch = true,
  isMenuOpen,
  selectRef,
  menuProps,
  menuRef,
  toggleMenu,
  control,
  children,
  testID
}) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)

  return (
    <View style={[styles.selectContainer, containerStyle]}>
      {!!label && (
        <Text
          appearance="secondaryText"
          fontSize={14}
          weight="regular"
          style={[spacings.mbMi, labelStyle]}
          testID={testID}
        >
          {label}
        </Text>
      )}
      <SelectedMenuOption
        disabled={disabled}
        isMenuOpen={isMenuOpen}
        selectRef={selectRef}
        toggleMenu={toggleMenu}
        value={value}
        placeholder={placeholder}
        selectStyle={selectStyle}
      />
      {!!isMenuOpen && (
        <MenuContainer menuRef={menuRef} menuStyle={menuStyle} menuProps={menuProps}>
          {!!withSearch && menuProps.position === 'bottom' && (
            <Search
              placeholder={t('Search...')}
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
              placeholder={t('Search...')}
              autoFocus
              control={control}
              containerStyle={spacings.mb0}
              borderWrapperStyle={styles.searchBorderWrapperStyle}
              inputWrapperStyle={styles.topSearchInputWrapperStyle}
              leftIconStyle={spacings.pl}
            />
          )}
        </MenuContainer>
      )}
    </View>
  )
}

export default React.memo(SelectContainer)
