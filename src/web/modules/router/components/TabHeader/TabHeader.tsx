import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import NavIconWrapper from '@common/components/NavIconWrapper'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import routesConfig from '@common/modules/router/config/routesConfig'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

const TabHeader: React.FC<any> = () => {
  const { t } = useTranslation()
  const { path, params } = useRoute()
  const { navigate } = useNavigation()

  const handleGoBack = useCallback(() => navigate(-1), [navigate])

  const canGoBack = !!params?.prevRoute

  const renderHeaderLeft = () => {
    if (canGoBack) {
      return (
        <NavIconWrapper
          onPress={handleGoBack}
          style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}
        >
          <LeftArrowIcon width={50} height={50} color={colors.martinique} />
          <Text fontSize={18} weight="regular" color={colors.martinique} style={spacings.ml}>
            {t('Back')}
          </Text>
        </NavIconWrapper>
      )
    }

    return null
  }

  const nextRoute = path?.substring(1) as ROUTES
  const { title } = routesConfig[nextRoute]

  return (
    <View style={[styles.container, spacings.pv, spacings.ph]}>
      <View>{renderHeaderLeft()}</View>
      <Text
        fontSize={18}
        weight="regular"
        style={[styles.title, spacings.pl, canGoBack ? { paddingRight: 140 } : spacings.pr]}
        numberOfLines={2}
      >
        {title || ' '}
      </Text>
    </View>
  )
}

export default React.memo(TabHeader)
