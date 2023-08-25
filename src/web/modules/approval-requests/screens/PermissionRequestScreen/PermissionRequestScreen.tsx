import { networks } from 'ambire-common/src/consts/networks'
import React, { useCallback, useState } from 'react'
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
import useApproval from '@web/hooks/useApproval'

import styles from './styles'

const PermissionRequestScreen = () => {
  const { t } = useTranslation()
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { approval, rejectApproval, resolveApproval } = useApproval()

  const handleDenyButtonPress = useCallback(
    () => rejectApproval(t('User rejected the request.')),
    [t, rejectApproval]
  )

  const handleAuthorizeButtonPress = useCallback(() => {
    setIsAuthorizing(true)
    resolveApproval({
      defaultChain: networks[0].nativeAssetSymbol
    })
  }, [resolveApproval])

  return (
    <Wrapper hasBottomTabNav={false}>
      <Panel>
        <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
          <ManifestImage
            uri={approval?.data?.params?.icon}
            size={64}
            fallback={() => <ManifestFallbackIcon />}
          />
        </View>

        <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
          {approval?.data?.params?.origin ? new URL(approval?.data?.params?.origin).hostname : ''}
        </Title>

        <View>
          <Trans>
            <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
              <Text fontSize={14} weight="regular">
                {'The dApp '}
              </Text>
              <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                {approval?.data?.params?.name || ''}
              </Text>
              <Text fontSize={14} weight="regular">
                {' is requesting an authorization to communicate with Ambire Wallet'}
              </Text>
            </Text>
          </Trans>
        </View>

        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              disabled={isAuthorizing}
              type="danger"
              onPress={handleDenyButtonPress}
              text={t('Deny')}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              type="outline"
              onPress={handleAuthorizeButtonPress}
              disabled={isAuthorizing}
              text={isAuthorizing ? t('Authorizing...') : t('Authorize')}
            />
          </View>
        </View>

        <Text fontSize={14} style={textStyles.center}>
          {t('Webpage can be disconnected any time from the Ambire extension settings.')}
        </Text>
      </Panel>
    </Wrapper>
  )
}

export default React.memo(PermissionRequestScreen)
