import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Sponsor } from '@ambire-common/libs/erc7677/types'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

const Sponsored = ({ sponsor }: { sponsor?: Sponsor }) => {
  const { t } = useTranslation()
  const { currentUserRequest } = useController('RequestsController').state
  const { theme } = useTheme()

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pt]}>
      <ManifestImage
        uri={sponsor?.icon || currentUserRequest?.dappPromises?.[0]?.session.icon || ''}
        size={64}
        isRound
        containerStyle={{ backgroundColor: theme.secondaryBackground }}
        fallback={() => <ManifestFallbackIcon width={48} height={48} />}
      />
      <View style={[spacings.ml]}>
        <Text fontSize={20} weight="semiBold" style={spacings.mbTy}>
          {sponsor?.name ||
            currentUserRequest?.dappPromises?.[0]?.session.name ||
            "The App you're connected to"}
        </Text>
        <Text weight="medium" appearance="secondaryText">
          {t('is sponsoring this transaction')}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(Sponsored)
