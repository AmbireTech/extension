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
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import styles from './styles'

const DecryptRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest } = useRequestsControllerState()
  const { account } = useSelectedAccountControllerState()
  const keystoreState = useKeystoreControllerState()
  const { theme } = useTheme()

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'ethDecrypt' ? currentUserRequest : undefined),
    [currentUserRequest]
  )

  const { name, icon } = useDappInfo(userRequest)

  const selectedAccountKeyStoreKeys = useMemo(
    () => keystoreState.keys.filter((key) => account?.associatedKeys.includes(key.addr)),
    [keystoreState.keys, account?.associatedKeys]
  )

  const handleDecrypt = useCallback(() => {
    if (!userRequest) return

    if (!selectedAccountKeyStoreKeys.length) return

    const internalKey = selectedAccountKeyStoreKeys.find((k) => k.type === 'internal')
    if (!internalKey) return

    dispatch({
      type: 'MAIN_CONTROLLER_HANDLE_DECRYPT',
      params: {
        encryptedData: currentUserRequest?.meta?.params[1],
        requestId: userRequest.id,
        keyAddr: internalKey.addr,
        keyType: internalKey.type
      }
    })
  }, [userRequest, dispatch, selectedAccountKeyStoreKeys, currentUserRequest])

  const handleDeny = useCallback(() => {
    if (!userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: userRequest.id }
    })
  }, [userRequest, t, dispatch])

  // TODO: Display not supported for 1) smart accounts and 2) accounts with only hw wallet keys.
  return (
    <>
      <HeaderAccountAndNetworkInfo />
      <ScrollableWrapper hasBottomTabNav={false}>
        <Panel>
          <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
            <ManifestImage uri={icon} size={64} fallback={() => <ManifestFallbackIcon />} />
          </View>

          <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
            {userRequest?.dappPromises[0].session.origin
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
                    ' requires you to decrypt the following text in order to complete the operation:'
                  }
                </Text>
              </Text>
            </Trans>
          </View>

          <View style={styles.buttonsContainer}>
            <View style={styles.buttonWrapper}>
              <Button type="outline" onPress={handleDeny} text={t('Cancel')} />
              {/* TODO: Disable for view only accounts (or add import key prompt) */}
              <Button type="primary" onPress={handleDecrypt} text={t('Decrypt')} />
            </View>
          </View>
        </Panel>
      </ScrollableWrapper>
    </>
  )
}

export default React.memo(DecryptRequestScreen)
