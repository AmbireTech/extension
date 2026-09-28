import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import BatchIcon from '@common/assets/svg/BatchIcon'
import BatchIconAnimated from '@common/components/BatchIconAnimated'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import Header from '@common/modules/header/components/Header'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings, { SPACING_MD } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'

type Props = {
  title: string
  callsCount: number
  primaryButtonText: string
  secondaryButtonText: string
  onPrimaryButtonPress: () => void
  onSecondaryButtonPress: () => void
}

const { isRequestWindow, isPopup } = getUiType()

const BatchAdded: FC<Props> = ({
  title,
  callsCount,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonPress,
  onSecondaryButtonPress
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isNarrowWebLayout } = useCompactLayout()

  const isWideWebLayout = isWeb && !isNarrowWebLayout
  const buttonSize = isWideWebLayout ? 'smaller' : 'regular'

  const secondaryButton = (
    <Button
      onPress={onSecondaryButtonPress}
      hasBottomSpacing={false}
      type="secondary"
      text={secondaryButtonText}
      textStyle={spacings.mlMi}
      testID="add-more-button"
      size={buttonSize}
      childrenPosition="left"
      style={isWideWebLayout ? spacings.mrLg : {}}
    >
      <AddCircularIcon width={24} height={24} color={theme.primaryText} />
    </Button>
  )

  const primaryButton = (
    <Button
      onPress={onPrimaryButtonPress}
      hasBottomSpacing={isMobile}
      textStyle={spacings.phTy}
      text={primaryButtonText}
      size={buttonSize}
      testID="go-dashboard-button"
    />
  )

  return (
    <LayoutWrapper
      style={isRequestWindow ? { borderRadius: 0, height: '100%' } : {}}
      backgroundStyle={isRequestWindow ? spacings.pt0 : {}}
    >
      {/* Same header as the Send and Swap & Bridge screens this is shown after */}
      {isMobile ? (
        <HeaderWithTitle title={t('Batch')} withBackButton={false} />
      ) : isPopup ? (
        <Header.Wrapper containerStyle={spacings.ptSm}>
          <Header.AccountData />
          <Header.Logo withOG />
        </Header.Wrapper>
      ) : (
        <ActionHeader />
      )}
      <View
        style={[
          spacings.phSm,
          flexbox.flex1,
          flexbox.alignCenter,
          // In a narrow view the header already spaces the content like on mobile
          isWeb && !isNarrowWebLayout && spacings.ptMd,
          // In a narrow view the footer pads its own bottom edge
          isWeb && !isNarrowWebLayout && spacings.pbSm
        ]}
      >
        {/* Scrolls on short screens, so the content is never cut off above the footer */}
        <ScrollableWrapper
          style={common.fullWidth}
          contentContainerStyle={flexbox.alignCenter}
          showsVerticalScrollIndicator={false}
        >
          {isWeb && (
            <Text fontSize={20} weight="medium" style={[spacings.mbMd, text.center]}>
              {title}
            </Text>
          )}
          <BatchIconAnimated />
          <Text fontSize={20} weight="medium" style={[spacings.mbSm, spacings.mtLg, text.center]}>
            {t('Successfully added to batch!')}
          </Text>
          <Text
            weight="medium"
            appearance="secondaryText"
            style={[text.center, { marginBottom: SPACING_MD * 2 }]}
          >
            {t('You are saving on gas fees compared to sending\nindividually.')}
          </Text>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.phSm,
              spacings.mb,
              spacings.pvTy,
              {
                borderRadius: 64,
                backgroundColor: theme.primaryAccent100
              }
            ]}
          >
            <BatchIcon width={24} height={24} color={theme.primaryAccent300} />
            <Text style={[spacings.mlSm]} color={theme.primaryAccent300}>
              {t('{{ callsCount }} transactions in batch', { callsCount })}
            </Text>
          </View>
          <Text fontSize={12} weight="medium" appearance="tertiaryText" style={text.center}>
            {t('You can add more transactions or\nmanage this batch on the dashboard.')}
          </Text>
        </ScrollableWrapper>
        <FooterGlassView
          size="sm"
          // In a narrow view the footer sits under the content like on mobile, instead of floating over it
          absolute={!isNarrowWebLayout}
          fullWidth={isNarrowWebLayout}
          innerContainerStyle={isNarrowWebLayout ? spacings.ph0 : undefined}
        >
          {isNarrowWebLayout ? (
            // Stacked full-width buttons, primary on top - same as the mobile footer
            <>
              {primaryButton}
              {secondaryButton}
            </>
          ) : isWeb ? (
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
              {secondaryButton}
              {primaryButton}
            </View>
          ) : (
            <>
              {secondaryButton}
              {primaryButton}
            </>
          )}
        </FooterGlassView>
      </View>
    </LayoutWrapper>
  )
}

export default BatchAdded
