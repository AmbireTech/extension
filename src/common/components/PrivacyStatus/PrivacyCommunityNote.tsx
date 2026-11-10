import React, { FC } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import PrivacyPoolsLogoIcon from '@common/assets/svg/PrivacyPoolsLogoIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  style?: StyleProp<ViewStyle>
}

/** Tells the user that privacy grows with the pool, so they start with a small amount. */
const PrivacyCommunityNote: FC<Props> = ({ style }) => {
  const { t } = useTranslation()

  return (
    <View style={[flexbox.directionRow, flexbox.alignStart, style]}>
      <PrivacyPoolsLogoIcon width={16} height={16} style={spacings.mrTy} />
      <Text fontSize={12} appearance="secondaryText" style={flexbox.flex1}>
        <Text fontSize={12} weight="medium" appearance="secondaryText">
          {t('Privacy Pools is a community effort.')}
        </Text>{' '}
        {t(
          'Each new deposit helps hide yours, so start with a small amount and leave it in for a while.'
        )}
      </Text>
    </View>
  )
}

export default React.memo(PrivacyCommunityNote)
