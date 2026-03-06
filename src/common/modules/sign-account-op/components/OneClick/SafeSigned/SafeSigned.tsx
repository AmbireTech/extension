import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Completed from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Completed'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  primaryButtonText: string
  onPrimaryButtonPress: () => void
}

const SafeSigned: FC<Props> = ({ primaryButtonText, onPrimaryButtonPress }) => {
  const { t } = useTranslation()

  return (
    <>
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
          titleSecondary={t('Successfully signed and sent to Safe global!')}
          openExplorerText={t('Safe global')}
          explorerLink="https://app.safe.global"
          beforeLinkOpenHandler={onPrimaryButtonPress}
        />
      </View>
      <FooterGlassView innerContainerStyle={{ ...spacings.phSm, ...spacings.pvSm }}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
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
    </>
  )
}

export default SafeSigned
