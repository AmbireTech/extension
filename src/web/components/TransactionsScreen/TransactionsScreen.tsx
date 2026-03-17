import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import FooterGlassView from '@common/components/FooterGlassView'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import ActionHeader from '@web/modules/action-requests/components/ActionHeader'

import LayoutWrapper from '../../../common/components/LayoutWrapper'

const { isPopup } = getUiType()

type WrapperProps = {
  children: React.ReactNode
}

type ContentProps = {
  children: React.ReactNode
  buttons: React.ReactNode
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

const Wrapper: FC<WrapperProps> = ({ children }) => {
  return (
    <LayoutWrapper>
      {isPopup ? <Header /> : <ActionHeader />}
      {children}
    </LayoutWrapper>
  )
}

const Content: FC<ContentProps> = ({ children, buttons }) => {
  return (
    <View style={[flexbox.flex1, spacings.phSm, spacings.pvSm]}>
      {children}
      <FooterGlassView size="sm">
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>{buttons}</View>
      </FooterGlassView>
    </View>
  )
}

export { Content, ItemPanel, Wrapper }
