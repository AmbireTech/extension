import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const { isTab, isPopup } = getUiType()

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
    <TabLayoutContainer
      header={<Header withDetailedAccountData={!isPopup} withOG />}
      withHorizontalPadding={false}
      footer={isTab ? buttons : null}
    >
      {children}
    </TabLayoutContainer>
  )
}

const Content: FC<ContentProps> = ({ children, buttons, scrollViewRef }) => {
  const { styles } = useTheme(getStyles)
  const { maxWidthSize, minHeightSize } = useWindowSize()
  const paddingHorizontalStyle = useMemo(() => getTabLayoutPadding(maxWidthSize), [maxWidthSize])

  return (
    <TabLayoutWrapperMainContent
      contentContainerStyle={{
        ...spacings.pv0,
        flex: 1,
        ...paddingHorizontalStyle,
        ...(isTab && minHeightSize('m') ? spacings.pt2Xl : spacings.pt),
        alignItems: 'center'
      }}
      wrapperRef={scrollViewRef}
    >
      <View style={styles.container}>
        {children}
        {!isTab && <View style={styles.nonTabButtons}>{buttons}</View>}
      </View>
    </TabLayoutWrapperMainContent>
  )
}

export { Content, ItemPanel, Wrapper }
