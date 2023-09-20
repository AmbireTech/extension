import React, { useCallback } from 'react'
import { View } from 'react-native'

import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import Wrapper from '@common/components/Wrapper'
import { Trans, useTranslation } from '@common/config/localization'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import ManifestImage from '@web/components/ManifestImage'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNotificationControllerState from '@web/hooks/useNotificationControllerState'

import styles from './styles'

const GetEncryptionPublicKeyRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentNotificationRequest } = useNotificationControllerState()

  const handleDeny = useCallback(() => {
    dispatch({
      type: 'NOTIFICATION_CONTROLLER_REJECT_REQUEST',
      params: { err: t('User rejected the request.') }
    })
  }, [t, dispatch])

  return (
    <Wrapper hasBottomTabNav={false}>
      <Panel>
        <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
          <ManifestImage
            uri={currentNotificationRequest?.params?.session?.icon}
            size={64}
            fallback={() => <ManifestFallbackIcon />}
          />
        </View>

        <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
          {currentNotificationRequest?.params?.origin
            ? new URL(currentNotificationRequest.params.origin).hostname
            : ''}
        </Title>

        <View>
          <Trans>
            <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
              <Text fontSize={14} weight="regular">
                {'The dApp '}
              </Text>
              <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                {currentNotificationRequest?.params?.session?.name || ''}
              </Text>
              <Text fontSize={14} weight="regular">
                {
                  ' wants to get your public encryption key. This method is deprecated and Ambire does not support it.'
                }
              </Text>
            </Text>
          </Trans>
        </View>

        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <Button type="outline" onPress={handleDeny} text={t('Okay')} />
          </View>
        </View>
      </Panel>
    </Wrapper>
  )
}

export default React.memo(GetEncryptionPublicKeyRequestScreen)
