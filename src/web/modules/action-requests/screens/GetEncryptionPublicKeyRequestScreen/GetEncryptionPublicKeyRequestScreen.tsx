import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { Trans, useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import ManifestImage from '@web/components/ManifestImage'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappInfo from '@web/hooks/useDappInfo'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'

import styles from './styles'

const GetEncryptionPublicKeyRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest } = useRequestsControllerState()
  const { theme } = useTheme()

  const userRequest = useMemo(
    () =>
      currentUserRequest?.kind === 'ethGetEncryptionPublicKey' ? currentUserRequest : undefined,
    [currentUserRequest]
  )

  const { name, icon } = useDappInfo(userRequest)

  const handleDeny = useCallback(() => {
    if (!userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: userRequest.id }
    })
  }, [userRequest, t, dispatch])

  return (
    <>
      <HeaderAccountAndNetworkInfo />
      <ScrollableWrapper hasBottomTabNav={false}>
        <Panel>
          <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
            <ManifestImage uri={icon} size={64} fallback={() => <ManifestFallbackIcon />} />
          </View>

          <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
            {userRequest?.dappPromises[0]?.session?.origin
              ? new URL(userRequest.dappPromises[0].session.origin).hostname
              : ''}
          </Title>

          <View>
            <Trans>
              <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                <Text fontSize={14} weight="regular">
                  {'The App '}
                </Text>
                <Text fontSize={14} weight="regular" color={theme.primaryLight}>
                  {name}
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
      </ScrollableWrapper>
    </>
  )
}

export default React.memo(GetEncryptionPublicKeyRequestScreen)
