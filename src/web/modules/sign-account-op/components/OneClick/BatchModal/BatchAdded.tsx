import React, { FC, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import BatchIconAnimated from '@common/components/BatchIconAnimated'
import { THEME_TYPES } from '@common/styles/themeConfig'

type Props = {
  title: string
  callsCount: number
  primaryButtonText: string
  secondaryButtonText: string
  onPrimaryButtonPress: () => void
  onSecondaryButtonPress: () => void
}

const BatchAdded: FC<Props> = ({
  title,
  callsCount,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonPress,
  onSecondaryButtonPress
}) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const { maxWidthSize } = useWindowSize()
  const paddingHorizontalStyle = useMemo(() => getTabLayoutPadding(maxWidthSize), [maxWidthSize])
  const scrollViewRef: any = useRef(null)

  return (
    <TabLayoutContainer
      backgroundColor={theme.primaryBackground}
      header={
        <Header
          backgroundColor="primaryBackground"
          displayBackButtonIn="never"
          mode="title"
          customTitle={title}
          withAmbireLogo
        />
      }
      withHorizontalPadding={false}
      footer={null}
      style={{ ...flexbox.alignEnd, ...spacings.pb }}
    >
      <TabLayoutWrapperMainContent
        contentContainerStyle={{
          ...spacings.pv0,
          ...paddingHorizontalStyle,
          ...flexbox.flex1
        }}
        wrapperRef={scrollViewRef}
        withScroll={false}
      >
        <View
          style={[
            flexbox.flex1,
            flexbox.alignCenter,
            flexbox.justifyCenter,
            spacings.pt2Xl,
            spacings.pbXl,
            { alignSelf: 'center' }
          ]}
        >
          <BatchIconAnimated />
          <Text fontSize={20} weight="medium" style={[spacings.mbTy, spacings.mtLg, text.center]}>
            {t('Successfully added to batch!')}
          </Text>
          <Text weight="medium" appearance="secondaryText" style={text.center}>
            {t('You are saving on gas fees compared\nto sending individually.')}
          </Text>

          <View style={[flexbox.alignCenter, flexbox.justifyCenter, spacings.mt2Xl]}>
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                spacings.ph,
                spacings.pvTy,
                {
                  borderRadius: 20,
                  backgroundColor: themeType === THEME_TYPES.DARK ? '#2e2a3b' : '#6000ff14'
                }
              ]}
            >
              <BatchIcon width={16} height={16} color={theme.linkText} />
              <Text fontSize={16} style={[spacings.mlSm]} color={theme.linkText}>
                {t('{{ callsCount }} transactions in batch', { callsCount })}
              </Text>
            </View>
            <Text
              fontSize={12}
              color={themeType === THEME_TYPES.DARK ? '#ffffff51' : '#767dad'}
              weight="medium"
              appearance="secondaryText"
              style={[text.center, spacings.mtTy]}
            >
              {t('You can add more transactions or\nmanage this batch in the dashboard.')}
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: theme.secondaryBorder,
            ...spacings.mvLg
          }}
        />
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
          <Button
            onPress={onSecondaryButtonPress}
            hasBottomSpacing={false}
            type="secondary"
            text={secondaryButtonText}
            textStyle={spacings.phTy}
            testID="add-more-button"
          />
          <Button
            onPress={onPrimaryButtonPress}
            hasBottomSpacing={false}
            textStyle={spacings.phTy}
            text={primaryButtonText}
            testID="go-dashboard-button"
          />
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default BatchAdded
