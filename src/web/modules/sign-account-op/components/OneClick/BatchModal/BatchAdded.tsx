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

type Props = {
  title: string
  primaryButtonText: string
  secondaryButtonText: string
  onPrimaryButtonPress: () => void
  onSecondaryButtonPress: () => void
}

const BatchAdded: FC<Props> = ({
  title,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonPress,
  onSecondaryButtonPress
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
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
            spacings.pbXl
          ]}
        >
          <BatchIcon width={64} height={64} color={theme.secondaryText} />
          <Text fontSize={20} weight="medium" style={[spacings.mbTy, spacings.mtLg, text.center]}>
            {t('Added to batch')}
          </Text>
          <Text weight="medium" appearance="secondaryText" style={text.center}>
            {t('You can manage your batch on the dashboard.')}
          </Text>
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
