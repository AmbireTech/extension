import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useResponsiveActionWindow from '@web/hooks/useResponsiveActionWindow'

import getStyles from './styles'

interface Props {
  name?: string
  icon?: string
  intentText: string
}

const RequestingDappInfo: FC<Props> = ({ name, icon, intentText }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()

  return (
    <View style={[isWeb && flexbox.directionRow, isMobile && flexbox.alignCenter]}>
      {icon ? (
        <Image
          source={{ uri: icon }}
          style={{
            ...styles.image,
            width: 48 * responsiveSizeMultiplier,
            height: 48 * responsiveSizeMultiplier
          }}
          resizeMode="contain"
        />
      ) : (
        <View
          style={{
            ...styles.fallbackIcon,
            ...spacings.pvMi,
            ...spacings.phMi,
            width: 48 * responsiveSizeMultiplier,
            height: 48 * responsiveSizeMultiplier
          }}
        >
          <DAppsIcon style={{ width: '100%', height: '100%' }} />
        </View>
      )}
      <View style={[isWeb && flexbox.flex1, isWeb && spacings.mlSm, isMobile && spacings.mtTy]}>
        <Text
          fontSize={16 * responsiveSizeMultiplier}
          appearance="secondaryText"
          weight="semiBold"
          style={isMobile && text.center}
        >
          {name || t('The App')}
        </Text>
        <Text
          fontSize={14 * responsiveSizeMultiplier}
          appearance="secondaryText"
          style={isMobile && text.center}
        >
          {intentText}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(RequestingDappInfo)
