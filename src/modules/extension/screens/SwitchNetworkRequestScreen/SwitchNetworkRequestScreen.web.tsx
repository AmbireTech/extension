import networks from 'ambire-common/src/constants/networks'
import React, { useLayoutEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import CrossChainArrowIcon from '@assets/svg/CrossChainArrowIcon'
import ManifestFallbackIcon from '@assets/svg/ManifestFallbackIcon'
import { Trans, useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import NetworkIcon from '@modules/common/components/NetworkIcon'
import Panel from '@modules/common/components/Panel'
import Spinner from '@modules/common/components/Spinner'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import useAmbireExtension from '@modules/common/hooks/useAmbireExtension'
import useExtensionApproval from '@modules/common/hooks/useExtensionApproval'
import useNetwork from '@modules/common/hooks/useNetwork'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import ManifestImage from '@modules/extension/components/ManifestImage'

import styles from './styles'

const SwitchNetworkRequestScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const { params } = useAmbireExtension()
  const { network, setNetwork } = useNetwork()
  const { approval, rejectApproval, resolveApproval } = useExtensionApproval()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('Switch Network Request')
    })
  }, [t, navigation])

  const newNetwork = useMemo(() => {
    const chainId = approval?.data?.params?.data?.[0]?.chainId
    if (chainId) {
      return networks.find((a) => {
        return a.chainId === Number(chainId)
      })
    }
  }, [approval])

  console.log(approval)

  // TODO:
  const [loading, setLoading] = useState(false)

  const handleDenyButtonPress = () => {
    rejectApproval()
  }

  const handleSwitchNetworkButtonPress = () => {
    if (newNetwork) {
      setNetwork(newNetwork?.chainId)
      resolveApproval(true)
    }
  }

  // useEffect(() => {
  //   if (newNetwork?.name === network?.name) {
  //     window.close()
  //   }
  // }, [newNetwork?.name, network?.name])

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        hasBottomTabNav={false}
        contentContainerStyle={{
          paddingTop: 0
        }}
      >
        <Panel type="filled">
          {/* <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
            <ManifestImage host={targetHost} size={64} fallback={() => <ManifestFallbackIcon />} />
          </View> */}

          {/* <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>{targetHost}</Title> */}

          <View style={flexboxStyles.alignCenter}>{!!loading && <Spinner />}</View>
          {!loading && !!newNetwork && (
            <>
              <View>
                <Trans>
                  <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                    <Text fontSize={14} weight="regular">
                      {'Allow '}
                    </Text>
                    <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                      {/* {targetHost} */}
                    </Text>
                    <Text fontSize={14} weight="regular">
                      {' to switch the network?'}
                    </Text>
                  </Text>
                </Trans>
                {!!network && !!newNetwork && (
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
                        <NetworkIcon name={network?.id} width={64} height={64} />
                      </View>
                      <Text>{network?.name}</Text>
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
                        <NetworkIcon name={newNetwork?.id} width={64} height={64} />
                      </View>
                      <Text>{newNetwork?.name}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.buttonsContainer}>
                <View style={styles.buttonWrapper}>
                  <Button type="danger" onPress={handleDenyButtonPress} text={t('Deny')} />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    type="outline"
                    onPress={handleSwitchNetworkButtonPress}
                    text={t('Switch Network')}
                  />
                </View>
              </View>
            </>
          )}
          {!loading && !newNetwork && (
            <View>
              <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                {t('Ambire Wallet does not support this network.')}
              </Text>
              <Button type="danger" onPress={handleDenyButtonPress} text={t('Cancel')} />
            </View>
          )}
        </Panel>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default SwitchNetworkRequestScreen
