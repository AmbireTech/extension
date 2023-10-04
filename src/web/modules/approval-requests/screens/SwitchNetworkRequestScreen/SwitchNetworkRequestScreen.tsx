import networks from 'ambire-common/src/constants/networks'
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import CrossChainArrowIcon from '@common/assets/svg/CrossChainArrowIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import NetworkIcon from '@common/components/NetworkIcon'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import Wrapper from '@common/components/Wrapper'
import { Trans, useTranslation } from '@common/config/localization'
import useNetwork from '@common/hooks/useNetwork'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import ManifestImage from '@web/components/ManifestImage'
import useApproval from '@web/hooks/useApproval'

import styles from './styles'

const SwitchNetworkRequestScreen = () => {
  const { t } = useTranslation()
  const { network, setNetwork } = useNetwork()
  const { approval, rejectApproval, resolveApproval } = useApproval()
  const [isSwitching, setIsSwitching] = useState(false)

  // Cache it on purpose. Otherwise, when the user switches the network,
  // the current network changes really fast (for a split second),
  //  and the user sees the wrong network icon (and info).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentNetwork = useMemo(() => network, [])

  const nextNetwork = useMemo(() => {
    const chainId = approval?.data?.params?.data?.[0]?.chainId

    if (!chainId) return undefined

    return networks.find((a) => a.chainId === Number(chainId))
  }, [approval])

  const handleDenyButtonPress = useCallback(
    () => rejectApproval(t('User rejected the request.')),
    [t, rejectApproval]
  )

  const handleSwitchNetworkButtonPress = useCallback(() => {
    setIsSwitching(true)
    if (nextNetwork) {
      setNetwork(nextNetwork?.chainId)
      resolveApproval(true)
    }
  }, [nextNetwork, resolveApproval, setNetwork])

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
              uri={approval?.data?.params?.session?.icon}
              size={64}
              fallback={() => <ManifestFallbackIcon />}
            />
          </View>

          <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
            {approval?.data?.params?.session?.origin
              ? new URL(approval?.data?.params?.session?.origin).hostname
              : ''}
          </Title>

          {!!nextNetwork && (
            <>
              <View>
                <Trans>
                  <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                    <Text fontSize={14} weight="regular">
                      {'Allow '}
                    </Text>
                    <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                      {approval?.data?.params?.session?.name || 'webpage'}
                    </Text>
                    <Text fontSize={14} weight="regular">
                      {' to switch the network?'}
                    </Text>
                  </Text>
                </Trans>
                {!!currentNetwork && !!nextNetwork && (
                  <View
                    style={[spacings.mbLg, flexboxStyles.directionRow, flexboxStyles.alignCenter]}
                  >
                    <View
                      style={[
                        flexboxStyles.alignCenter,
                        flexboxStyles.justifyCenter,
                        spacings.phLg,
                        flexboxStyles.flex1
                      ]}
                    >
                      <View style={styles.networkIconWrapper}>
                        <NetworkIcon name={currentNetwork?.id} width={64} height={64} />
                      </View>
                      <Text>{currentNetwork?.name}</Text>
                    </View>
                    <View style={spacings.pbMd}>
                      <CrossChainArrowIcon />
                    </View>
                    <View
                      style={[
                        flexboxStyles.alignCenter,
                        flexboxStyles.justifyCenter,
                        spacings.phLg,
                        flexboxStyles.flex1
                      ]}
                    >
                      <View style={styles.networkIconWrapper}>
                        <NetworkIcon name={nextNetwork?.id} width={64} height={64} />
                      </View>
                      <Text>{nextNetwork?.name}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.buttonsContainer}>
                <View style={styles.buttonWrapper}>
                  <Button
                    disabled={isSwitching}
                    type="danger"
                    onPress={handleDenyButtonPress}
                    text={t('Deny')}
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    disabled={isSwitching}
                    type="outline"
                    onPress={handleSwitchNetworkButtonPress}
                    text={isSwitching ? t('Switching...') : t('Switch Network')}
                  />
                </View>
              </View>
            </>
          )}
          {!nextNetwork && (
            <View>
              <Trans
                values={{
                  unsupportedNetworkName:
                    approval?.data?.params?.data?.[0]?.chainName || t('an unsupported network')
                }}
              >
                <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                  <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                    {approval?.data?.params?.session?.name || 'Webpage'}
                  </Text>
                  <Text fontSize={14} weight="regular">
                    {' wants to switch the network to {{unsupportedNetworkName}}.'}
                  </Text>
                </Text>
              </Trans>

              <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                {t(
                  'Ambire Wallet does not support {{unsupportedNetworkName}} network, so this switch is not possible.',
                  {
                    unsupportedNetworkName:
                      approval?.data?.params?.data?.[0]?.chainName || t('this')
                  }
                )}
              </Text>
              <Button type="danger" onPress={handleDenyButtonPress} text={t('Decline')} />
            </View>
          )}
        </Panel>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default React.memo(SwitchNetworkRequestScreen)
