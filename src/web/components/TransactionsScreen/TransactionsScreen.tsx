import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const { isTab, isPopup } = getUiType()

type WrapperProps = {
  children: React.ReactNode
  title: string | React.ReactNode
  buttons: React.ReactNode
}

type ContentProps = {
  children: React.ReactNode
  buttons: React.ReactNode
  scrollViewRef?: React.RefObject<any>
}

type FormProps = {
  children: React.ReactNode
}

const Wrapper: FC<WrapperProps> = ({ children, buttons }) => {
  const { theme } = useTheme(getStyles)

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
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
        ...paddingHorizontalStyle,
        ...(isTab ? (minHeightSize('m') ? {} : spacings.pt2Xl) : {}),
        flexGrow: 1
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

const Form: FC<FormProps> = ({ children }) => {
  const { styles } = useTheme(getStyles)

  return <View style={styles.form}>{children}</View>
}

export { Wrapper, Content, Form }
