import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import BatchIcon from '@common/assets/svg/BatchIcon'
import BatchIconAnimated from '@common/components/BatchIconAnimated'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings, { SPACING_MD } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

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
  const { theme } = useTheme()

  return (
    <LayoutWrapper>
      <Header />
      <View
        style={[spacings.phSm, flexbox.flex1, flexbox.alignCenter, spacings.ptMd, spacings.pbSm]}
      >
        <Text fontSize={20} weight="medium" style={[spacings.mbMd, text.center]}>
          {title}
        </Text>
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
          {t('You can add more transactions or\nmanage this batch in the dashboard.')}
        </Text>

        <FooterGlassView size="sm">
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
            <Button
              onPress={onSecondaryButtonPress}
              hasBottomSpacing={false}
              type="secondary"
              text={secondaryButtonText}
              textStyle={spacings.mlMi}
              testID="add-more-button"
              size="smaller"
              childrenPosition="left"
              style={spacings.mrLg}
            >
              <AddCircularIcon width={24} height={24} color={theme.primaryText} />
            </Button>
            <Button
              onPress={onPrimaryButtonPress}
              hasBottomSpacing={false}
              textStyle={spacings.phTy}
              text={primaryButtonText}
              size="smaller"
              testID="go-dashboard-button"
            />
          </View>
        </FooterGlassView>
      </View>
    </LayoutWrapper>
  )
}

export default BatchAdded
