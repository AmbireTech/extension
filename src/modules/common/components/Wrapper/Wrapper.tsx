import React from 'react'
import {
  FlatList,
  FlatListProps,
  Platform,
  ScrollView,
  ScrollViewProps,
  SectionList,
  SectionListProps,
  View
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isWeb } from '@config/env'
import { TAB_BAR_HEIGHT } from '@modules/common/constants/router'
import useTheme from '@modules/common/hooks/useTheme'
import spacings from '@modules/common/styles/spacings'

import createStyles from './styles'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum WRAPPER_TYPES {
  SCROLL_VIEW = 'scrollview',
  KEYBOARD_AWARE_SCROLL_VIEW = 'keyboard-aware-scrollview',
  FLAT_LIST = 'flatlist',
  SECTION_LIST = 'sectionlist',
  VIEW = 'view'
}

// @ts-ignore ignored because SectionList and FlatList receive props with same names
interface Props
  extends ScrollViewProps,
    Partial<FlatListProps<any>>,
    Partial<SectionListProps<any, any>> {
  type?: WRAPPER_TYPES
  hasBottomTabNav?: boolean
  extraHeight?: number
}

const Wrapper = ({
  style = {},
  contentContainerStyle = {},
  children,
  type = WRAPPER_TYPES.SCROLL_VIEW,
  keyboardShouldPersistTaps,
  keyboardDismissMode,
  hasBottomTabNav,
  extraHeight,
  ...rest
}: Props) => {
  const { styles } = useTheme(createStyles)
  const insets = useSafeAreaInsets()

  const horizontalSpacing = isWeb && !!rest.refreshControl ? spacings.phTy : spacings.ph

  if (type === WRAPPER_TYPES.FLAT_LIST) {
    return (
      // @ts-ignore
      <FlatList
        style={[styles.wrapper, horizontalSpacing, style]}
        contentContainerStyle={[
          styles.contentContainerStyle,
          !!hasBottomTabNav && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
          contentContainerStyle
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        alwaysBounceVertical={false}
        {...rest}
      />
    )
  }

  if (type === WRAPPER_TYPES.SECTION_LIST) {
    return (
      // @ts-ignore
      <SectionList
        style={[styles.wrapper, horizontalSpacing, style]}
        contentContainerStyle={[
          styles.contentContainerStyle,
          !!hasBottomTabNav && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
          contentContainerStyle
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        alwaysBounceVertical={false}
        {...rest}
      />
    )
  }

  if (type === WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW) {
    return (
      <KeyboardAwareScrollView
        style={[styles.wrapper, horizontalSpacing, style]}
        contentContainerStyle={[
          styles.contentContainerStyle,
          !!hasBottomTabNav && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
          contentContainerStyle
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        alwaysBounceVertical={false}
        enableOnAndroid
        keyboardOpeningTime={100}
        extraScrollHeight={hasBottomTabNav ? -TAB_BAR_HEIGHT : 0}
        // Adds extra offset between the keyboard and the focused input
        extraHeight={extraHeight || 75}
        {...rest}
      >
        {children}
      </KeyboardAwareScrollView>
    )
  }

  if (type === WRAPPER_TYPES.VIEW) {
    return <View style={style}>{children}</View>
  }

  return (
    <ScrollView
      style={[styles.wrapper, horizontalSpacing, style]}
      contentContainerStyle={[
        styles.contentContainerStyle,
        !!hasBottomTabNav && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
        contentContainerStyle
      ]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
      keyboardDismissMode={keyboardDismissMode || 'none'}
      alwaysBounceVertical={false}
      {...rest}
    >
      {children}
    </ScrollView>
  )
}

export default Wrapper
