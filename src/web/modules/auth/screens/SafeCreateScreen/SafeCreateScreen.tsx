import React, { useCallback, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Panel from '@common/components/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SafeCreateForm from '@common/modules/auth/components/SafeCreateForm'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const SafeCreateScreen = () => {
  const { goToPrevRoute, isCreateButtonDisabled, handleCreate, ...formProps } = useSafeCreate()
  const { t } = useTranslation()
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
          onBackButtonPress={goToPrevRoute}
          title={t('Create Safe account')}
          step={1}
          totalSteps={1}
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
              <Text fontSize={14} appearance="secondaryText" style={[spacings.mbTy, text.center]}>
                {t('Choose owners and required confirmations')}
              </Text>
              <SafeCreateForm
                {...formProps}
                // The onboarding panel is too narrow to fit a full address
                withShortenedAddresses
              />
            </ScrollableWrapper>
            <FooterGlassView
              size="sm"
              // Flush with the bottom of the panel content instead of the default offset
              style={{ bottom: 0 }}
              // The footer floats over the scrollable owners, which the complex blur is meant for
              isSimpleBlur={false}
              onLayout={handleFooterLayout}
            >
              <Button
                testID="safe-create-button"
                size="large"
                text={t('Create Multisig')}
                hasBottomSpacing={false}
                onPress={handleCreate}
                disabled={isCreateButtonDisabled}
              />
            </FooterGlassView>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(SafeCreateScreen)
