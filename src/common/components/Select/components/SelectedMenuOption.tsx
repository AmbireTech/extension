import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from '../styles'
import { SelectProps } from '../types'
import { Option } from './MenuOption'

type SelectedMenuOptionProps = Pick<
  SelectProps,
  | 'disabled'
  | 'value'
  | 'clearValue'
  | 'placeholder'
  | 'selectStyle'
  | 'withClearButton'
  | 'hoveredSelectStyle'
  | 'selectBorderWrapperStyle'
  | 'size'
> & {
  isMenuOpen: boolean
  selectRef: React.RefObject<View>
  toggleMenu: () => void
}

const SelectedMenuOption: FC<SelectedMenuOptionProps> = ({
  disabled,
  isMenuOpen,
  selectRef,
  toggleMenu,
  value,
  clearValue,
  withClearButton,
  placeholder,
  selectStyle,
  hoveredSelectStyle,
  selectBorderWrapperStyle,
  size
}) => {
  const { t } = useTranslation()
  const { theme, styles, themeType } = useTheme(getStyles)

  // We cannot use the disabled prop directly on the Pressable component
  // because it doesn't allow us to use Tooltips or other hoverable elements
  // inside of disabled components.
  const onPressWrapped = useCallback(() => {
    if (disabled) return

    toggleMenu()
  }, [disabled, toggleMenu])

  return (
    <Pressable
      style={[
        styles.selectBorderWrapper,
        // @ts-ignore
        disabled && { opacity: 0.6, cursor: 'default' },
        isMenuOpen && {
          borderColor:
            themeType === THEME_TYPES.DARK ? `${theme.linkText as string}35` : theme.infoBackground
        },
        selectBorderWrapperStyle
      ]}
      onPress={onPressWrapped}
    >
      {({ hovered }: any) => (
        <View
          ref={selectRef}
          style={[
            styles.select,
            size && styles[`${size}Select`],
            {
              borderColor: isMenuOpen
                ? themeType === THEME_TYPES.DARK
                  ? theme.linkText
                  : theme.primary
                : theme.secondaryBorder
            },
            selectStyle,
            hovered && hoveredSelectStyle
          ]}
        >
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, spacings.prTy]}>
            {!!value && <Option item={value} />}
            {!value && (
              <Text fontSize={14} appearance="secondaryText">
                {placeholder || t('Select...')}
              </Text>
            )}
          </View>
          {withClearButton ? (
            <Pressable onPress={() => !!clearValue && clearValue()}>
              <CloseIcon width={12} height={12} strokeWidth="1.75" />
            </Pressable>
          ) : (
            <>
              {!!isMenuOpen && <UpArrowIcon />}
              {!isMenuOpen && <DownArrowIcon />}
            </>
          )}
        </View>
      )}
    </Pressable>
  )
}

export default SelectedMenuOption
