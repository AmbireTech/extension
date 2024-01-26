import React, { useCallback, useEffect, useState } from 'react'
import { ColorValue, Image, TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation, { titleChangeEventStream } from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import routesConfig from '@common/modules/router/config/routesConfig'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { tabLayoutWidths } from '@web/components/TabLayoutWrapper'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

interface Props {
  mode?: 'title' | 'image-and-title' | 'custom-inner-content' | 'custom'
  customTitle?: string
  withPopupBackButton?: boolean
  withAmbireLogo?: boolean
  image?: string
  children?: any
  backgroundColor?: ColorValue
  forceBack?: boolean
  onGoBackPress?: () => void
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const { isTab, isPopup } = getUiType()

const Header: React.FC<Props> = ({
  mode = 'title',
  customTitle,
  withPopupBackButton = false,
  withAmbireLogo,
  children,
  backgroundColor,
  forceBack,
  onGoBackPress,
  image,
  width = 'xl'
}) => {
  const { styles } = useTheme(getStyles)

  const { path, params } = useRoute()
  const { navigate } = useNavigation()
  const { t } = useTranslation()

  const [title, setTitle] = useState('')
  const handleGoBack = useCallback(() => navigate(params?.backTo || -1), [navigate, params])
  const showBackButtonInPopup = isPopup && withPopupBackButton

  const navigationEnabled = !getUiType().isNotification

  const canGoBack =
    !!params?.prevRoute?.key &&
    params?.prevRoute?.pathname !== '/' &&
    path !== '/get-started' &&
    navigationEnabled

  useEffect(() => {
    if (!path) return

    const nextRoute = path?.substring(1)
    setTitle((routesConfig as any)?.[nextRoute]?.title || '')
  }, [path])

  useEffect(() => {
    const subscription = titleChangeEventStream!.subscribe({ next: (v) => setTitle(v) })
    return () => subscription.unsubscribe()
  }, [])

  const renderBackButton = () => {
    return (
      <TouchableOpacity
        style={[flexbox.directionRow, flexbox.alignCenter]}
        onPress={onGoBackPress || handleGoBack}
      >
        <LeftArrowIcon />
        <Text style={spacings.plTy} fontSize={16} weight="medium" appearance="secondaryText">
          {t('Back')}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, !!backgroundColor && { backgroundColor }]}>
      {mode !== 'custom' ? (
        <View style={[styles.widthContainer, { maxWidth: tabLayoutWidths[width] }]}>
          <View style={styles.sideContainer}>
            {showBackButtonInPopup && (!!canGoBack || !!forceBack) && renderBackButton()}
          </View>
          {/* Middle content start */}
          {mode === 'title' && (
            <View style={styles.containerInner}>
              <Text
                weight="medium"
                fontSize={isTab ? 24 : 20}
                style={styles.title}
                numberOfLines={2}
              >
                {customTitle || title || ''}
              </Text>
            </View>
          )}
          {mode === 'image-and-title' && (
            <View style={styles.imageAndTitleContainer}>
              {image && <Image source={{ uri: image }} style={styles.image} />}
              <Text weight="medium" fontSize={20}>
                {customTitle || title}
              </Text>
            </View>
          )}
          {mode === 'custom-inner-content' && <View style={styles.containerInner}>{children}</View>}
          {/* Middle content end */}
          <View style={[styles.sideContainer, flexbox.alignEnd]}>
            {!!withAmbireLogo && <AmbireLogoHorizontal width={72} />}
          </View>
        </View>
      ) : (
        children
      )}
    </View>
  )
}

export default React.memo(Header)
