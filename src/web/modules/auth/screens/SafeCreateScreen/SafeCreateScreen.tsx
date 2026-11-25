import React, { useCallback, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import FooterGlassView from '@common/components/FooterGlassView'
import Panel from '@common/components/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import useTheme from '@common/hooks/useTheme'
import SafeCreateContent from '@common/modules/auth/components/SafeCreateContent'
import SafeCreateFooterButton from '@common/modules/auth/components/SafeCreateFooterButton'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const SafeCreateScreen = () => {
  const safeCreate = useSafeCreate()
  const { theme } = useTheme()
  const [footerHeight, setFooterHeight] = useState(0)

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height)
  }, [])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={safeCreate.handleBackPress}
          title={safeCreate.title}
          style={flexbox.flex1}
          titleContainerStyle={spacings.mbSm}
        >
          <View style={flexbox.flex1}>
            <ScrollableWrapper
              style={flexbox.flex1}
              // The footer floats over the content, so reserve enough space for the
              // last item to be scrolled above it
              contentContainerStyle={{ paddingBottom: footerHeight + SPACING_SM }}
              showsVerticalScrollIndicator={false}
            >
              <SafeCreateContent safeCreate={safeCreate} subtitleStyle={text.center} />
            </ScrollableWrapper>
            <FooterGlassView
              size="sm"
              // Flush with the bottom of the panel content instead of the default offset
              style={{ bottom: 0 }}
              // The footer floats over the scrollable owners, which the complex blur is meant for
              isSimpleBlur={false}
              onLayout={handleFooterLayout}
            >
              <SafeCreateFooterButton safeCreate={safeCreate} />
            </FooterGlassView>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(SafeCreateScreen)
