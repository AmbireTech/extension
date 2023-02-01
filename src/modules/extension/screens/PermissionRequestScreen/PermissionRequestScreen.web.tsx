import React, { useEffect, useLayoutEffect, useState } from 'react'
import { View } from 'react-native'

import ManifestFallbackIcon from '@assets/svg/ManifestFallbackIcon'
import { Trans, useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import Panel from '@modules/common/components/Panel'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import useApproval from '@modules/common/hooks/useApproval'
import useNetwork from '@modules/common/hooks/useNetwork'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import ManifestImage from '@modules/extension/components/ManifestImage'
import { Approval } from '@web/background/services/notification'

import styles from './styles'

const PermissionRequestScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const { network } = useNetwork()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('Dapp Wants Permission to Connect')
    })
  }, [t, navigation])

  const [loading, setLoading] = useState(false)
  const { getApproval, rejectApproval, resolveApproval } = useApproval()
  const [approval, setApproval] = useState<Approval | null>(null)

  const init = async () => {
    const approvalRes = await getApproval()
    if (!approvalRes) {
      window.close()
      return
    }

    setApproval(approvalRes)
  }

  useEffect(() => {
    init()
  }, [])

  const handleDenyButtonPress = () => {
    rejectApproval('User rejected the request.')
  }

  const handleAuthorizeButtonPress = () => {
    setLoading(true)
    resolveApproval({
      defaultChain: network?.nativeAssetSymbol
    })
  }

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        hasBottomTabNav={false}
        contentContainerStyle={{
          paddingTop: 0
        }}
      >
        <Panel type="filled">
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

          {!loading && (
            <>
              <View>
                <Trans>
                  <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                    <Text fontSize={14} weight="regular">
                      {'The dapp '}
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
                  <Button type="danger" onPress={handleDenyButtonPress} text={t('Deny')} />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    type="outline"
                    onPress={handleAuthorizeButtonPress}
                    text={t('Authorize')}
                  />
                </View>
              </View>

              <Text fontSize={14} style={textStyles.center}>
                {t('Dapps connection can be removed at any time from the extension settings.')}
              </Text>
            </>
          )}
        </Panel>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default PermissionRequestScreen
