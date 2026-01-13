import { Sponsor } from '@ambire-common/libs/erc7677/types'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

const Sponsored = ({ sponsor }: { sponsor?: Sponsor }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  if (sponsor && sponsor.text)
    return (
      <View style={[spacings.mt, flexbox.directionRow, flexbox.alignCenter]}>
        <SuccessIcon color={theme.successDecorative} />
        <Text fontSize={14} appearance="successText" style={spacings.mlTy}>
          {sponsor.text}
        </Text>
      </View>
    )

  return (
    <View>
      {sponsor ? (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {sponsor.icon && (
            <ManifestImage
              uri={sponsor.icon}
              size={64}
              fallback={() => <ManifestFallbackIcon width={64} height={64} />}
            />
          )}
          <View style={spacings.ml}>
            <Text fontSize={18} weight="semiBold" style={spacings.mbMi}>
              {sponsor.name}
            </Text>
            <Text fontSize={16} appearance="secondaryText">
              {t('is 🪄 sponsoring 🪄 this transaction')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <View style={spacings.ml}>
            <Text fontSize={18} weight="semiBold" style={spacings.mbMi}>
              {t("The dapp you're connected to")}
            </Text>
            <Text fontSize={16} appearance="secondaryText">
              {t('is 🪄 sponsoring 🪄 this transaction')}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default React.memo(Sponsored)
