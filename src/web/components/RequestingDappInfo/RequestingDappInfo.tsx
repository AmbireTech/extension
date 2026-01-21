import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
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
    <View style={flexbox.directionRow}>
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
            width: 48 * responsiveSizeMultiplier,
            height: 48 * responsiveSizeMultiplier
          }}
        >
          <DAppsIcon style={{ width: '100%', height: '100%' }} />
        </View>
      )}
      <View style={[flexbox.flex1, spacings.mlSm]}>
        <Text fontSize={16 * responsiveSizeMultiplier} appearance="secondaryText" weight="semiBold">
          {name || t('The App')}
        </Text>
        <Text fontSize={14 * responsiveSizeMultiplier} appearance="secondaryText">
          {intentText}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(RequestingDappInfo)
