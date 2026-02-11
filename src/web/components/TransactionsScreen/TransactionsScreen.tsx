import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import FooterGlassView from '@common/components/FooterGlassView'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { getUiType } from '@web/utils/uiType'

import LayoutWrapper from '../LayoutWrapper'
import getStyles from './styles'

const { isPopup } = getUiType()

type WrapperProps = {
  children: React.ReactNode
  buttons: React.ReactNode
}

type ContentProps = {
  children: React.ReactNode
  buttons: React.ReactNode
  scrollViewRef?: React.RefObject<any>
}

type ItemPanelProps = {
  children: React.ReactNode
  style?: ViewStyle
}

const ItemPanel: FC<ItemPanelProps> = ({ children, style = {} }) => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        ...spacings.phSm,
        ...spacings.pvSm,
        backgroundColor: theme.secondaryBackground,
        borderRadius: BORDER_RADIUS_PRIMARY,
        ...style
      }}
    >
      {children}
    </View>
  )
}

const Wrapper: FC<WrapperProps> = ({ children, buttons }) => {
  return (
    <LayoutWrapper>
      <Header withDetailedAccountData={!isPopup} withOG />
      {children}
    </LayoutWrapper>
  )
}

const Content: FC<ContentProps> = ({ children, buttons, scrollViewRef }) => {
  const { maxWidthSize } = useWindowSize()

  return (
    <View style={[flexbox.flex1, spacings.phSm, spacings.pvSm]}>
      {children}
      <FooterGlassView
        innerContainerStyle={{ ...spacings.phSm, ...spacings.pvSm }}
        borderRadius={28}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>{buttons}</View>
      </FooterGlassView>
    </View>
  )
}

export { Wrapper, Content, ItemPanel }
