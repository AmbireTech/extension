import React, { useCallback } from 'react'
import { View, ViewStyle } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SparklesIcon from '@common/assets/svg/SparklesIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

const UpdateAvailableBanner = ({ style }: { style?: ViewStyle }) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { dispatch } = useController('ExtensionUpdateController')

  const applyUpdate = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'applyUpdate', args: [] } })
  }, [dispatch])

  return (
    <HoverablePressable
      testID="button-apply-extension-update"
      style={[styles.container, style]}
      onPress={applyUpdate}
    >
      <View style={styles.content}>
        <SparklesIcon width={24} height={24} color={theme.secondaryAccent400} />
        <Text
          fontSize={16}
          weight="medium"
          appearance="primaryText"
          numberOfLines={1}
          style={styles.text}
        >
          {t('New version available. Click here to update')}
        </Text>
        <View style={styles.arrowWrapper}>
          <RightArrowIcon width={7} height={12} color={theme.iconPrimary} />
        </View>
      </View>
    </HoverablePressable>
  )
}

export default React.memo(UpdateAvailableBanner)
