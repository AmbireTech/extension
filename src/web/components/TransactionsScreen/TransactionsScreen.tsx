import React, { FC, useState } from 'react'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'

import FooterGlassView from '@common/components/FooterGlassView'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import Header from '@common/modules/header/components/Header'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import LayoutWrapper from '../../../common/components/LayoutWrapper'

const { isPopup, isRequestWindow } = getUiType()

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
    <LayoutWrapper
      style={isRequestWindow ? { borderRadius: 0, height: '100%' } : {}}
      backgroundStyle={isRequestWindow ? spacings.pt0 : {}}
    >
      {isPopup ? (
        <Header.Wrapper containerStyle={spacings.ptSm}>
          <Header.AccountData />
          <Header.Logo withOG />
        </Header.Wrapper>
      ) : (
        <ActionHeader />
      )}
      {children}
    </LayoutWrapper>
  )
}

const Content: FC<ContentProps> = ({ children, buttons }) => {
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()
  // Reserves exactly as much scroll space as the floating footer occupies, so content only
  // becomes scrollable once it would otherwise be covered by the footer, not before
  const [footerHeight, setFooterHeight] = useState(0)
  const handleFooterLayout = (event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height)
  }

  return (
    <View style={[flexbox.flex1, spacings.pvSm]}>
      <ScrollableWrapper
        contentContainerStyle={[
          flexbox.flex1,
          spacings.phSm,
          { paddingBottom: footerHeight ? footerHeight + SPACING_SM : 0 }
        ]}
      >
        {children}
      </ScrollableWrapper>
      <FooterGlassView
        size="sm"
        fullWidth={isCompactSidePanelLayout}
        style={isRequestWindow ? { bottom: SPACING } : {}}
        onLayout={handleFooterLayout}
      >
        {isCompactSidePanelLayout ? (
          buttons
        ) : (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>{buttons}</View>
        )}
      </FooterGlassView>
    </View>
  )
}

export { Content, ItemPanel, Wrapper }
