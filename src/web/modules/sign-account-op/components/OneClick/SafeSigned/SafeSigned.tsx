import React, { FC, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

import Completed from '../TrackProgress/ByStatus/Completed'

type Props = {
  title: string
  primaryButtonText: string
  onPrimaryButtonPress: () => void
}

const SafeSigned: FC<Props> = ({ title, primaryButtonText, onPrimaryButtonPress }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { maxWidthSize } = useWindowSize()
  const paddingHorizontalStyle = useMemo(() => getTabLayoutPadding(maxWidthSize), [maxWidthSize])
  const scrollViewRef: any = useRef(null)

  return (
    <TabLayoutContainer
      backgroundColor={theme.primaryBackground}
      header={<HeaderWithTitle displayBackButtonIn="never" title={title} />}
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
          <Completed
            title={t('Signed')}
            titleSecondary={t('Successfully signed and sent to safe global!')}
            openExplorerText={t('Safe global')}
            explorerLink="https://app.safe.global"
          />
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: theme.secondaryBorder,
            ...spacings.mvLg
          }}
        />
        <View style={[flexbox.directionRow, flexbox.justifyEnd]}>
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

export default SafeSigned
