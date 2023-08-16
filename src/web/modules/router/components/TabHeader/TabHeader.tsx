import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import NavIconWrapper from '@common/components/NavIconWrapper'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import routesConfig from '@common/modules/router/config/routesConfig'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import Stepper from '@web/modules/router/components/Stepper'

import styles from './styles'

const TabHeader: React.FC<any> = ({
  hideStepper = false,
  pageTitle = '',
  forceCanGoBack,
  onBack
}) => {
  const { t } = useTranslation()
  const { path, params } = useRoute()
  const { navigate } = useNavigation()

  const handleGoBack = useCallback(() => (onBack ? onBack() : navigate(-1)), [navigate, onBack])

  // Primarily, we depend on the existence of the prevRoute to display the Back button.
  // However, there are instances when we lack a previous route (e.g., transitioning from a Popup context to a Tab).
  // To accommodate such cases and ensure button visibility, we introduce the `forceCanGoBack` flag.
  const canGoBack = forceCanGoBack || !!params?.prevRoute

  const renderBackButton = () => {
    if (canGoBack) {
      return (
        <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
          <NavIconWrapper onPress={handleGoBack} style={styles.navIconContainerRegular}>
            <LeftArrowIcon width={36} height={36} />
          </NavIconWrapper>
          <Text style={spacings.plTy} fontSize={16} weight="medium">
            {t('Back')}
          </Text>
        </View>
      )
    }

    return null
  }

  const nextRoute = path?.substring(1) as ROUTES
  const { title, flow, flowStep } = routesConfig[nextRoute]

  const shouldDisplayStepper = flow && !hideStepper

  return (
    <View style={[styles.container, spacings.pv, spacings.ph]}>
      <View style={styles.sideContainer}>{renderBackButton()}</View>
      {!!shouldDisplayStepper && <Stepper step={flowStep} />}
      {!shouldDisplayStepper && (!!title || !!pageTitle) && (
        <Text
          fontSize={20}
          weight="medium"
          style={[styles.title, spacings.pl, canGoBack ? { paddingRight: 140 } : spacings.pr]}
          numberOfLines={2}
        >
          {pageTitle || title || ' '}
        </Text>
      )}
      <View style={styles.sideContainer} />
    </View>
  )
}

export default React.memo(TabHeader)
