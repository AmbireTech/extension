import networks from 'ambire-common/src/constants/networks'
import { BigNumber } from 'ethers'
import React, { useLayoutEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import Panel from '@modules/common/components/Panel'
import Spinner from '@modules/common/components/Spinner'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import useAmbireExtension from '@modules/common/hooks/useAmbireExtension'
import useNetwork from '@modules/common/hooks/useNetwork'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import ManifestImage from '@modules/extension/components/ManifestImage'
import { BACKGROUND } from '@web/constants/paths'
import { sendMessage } from '@web/services/ambexMessanger'

import styles from './styles'

const SwitchNetworkRequestScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const { params } = useAmbireExtension()
  const { network, setNetwork } = useNetwork()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('Switch Network Request')
    })
  }, [t, navigation])

  const targetHost = params.host

  const queue = useMemo(() => (params.queue ? JSON.parse(atob(params.queue)) : []), [params.queue])

  const sanitize2hex = (any) => {
    if (any instanceof BigNumber) {
      return any.toHexString()
    }

    if (any === undefined || any === null) {
      return any
    }
    return BigNumber.from(any).toHexString()
  }

  const message = useMemo(() => queue?.[0], [queue])
  const newNetwork = useMemo(
    () =>
      networks.find((a) => {
        return sanitize2hex(a.chainId) === sanitize2hex(message?.data?.params?.[0]?.chainId) // ethers BN ouputs 1 to 0x01 while some dapps ask for 0x1
      }),
    [message]
  )

  // TODO:
  const [loading, setLoading] = useState(false)

  const handleDenyButtonPress = () => {
    sendMessage({
      type: 'web3CallResponse',
      to: BACKGROUND,
      data: {
        originalMessage: message,
        rpcResult: {
          jsonrpc: '2.0',
          id: message?.data?.id,
          error: 'Switching network canceled!'
        }
      }
    })
    setTimeout(() => {
      window.close()
    }, 200)
  }

  const handleSwitchNetworkButtonPress = () => {
    if (newNetwork) {
      setNetwork(newNetwork?.chainId)
      sendMessage({
        type: 'web3CallResponse',
        to: BACKGROUND,
        data: {
          originalMessage: message,
          rpcResult: {
            jsonrpc: '2.0',
            id: message?.data?.id,
            result: {
              chainId: newNetwork?.chainId
            },
            success: true
          }
        }
      })
    }
    setTimeout(() => {
      window.close()
    }, 200)
  }

  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav={false}>
        <Panel type="filled">
          <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
            <ManifestImage host={targetHost} size={64} />
          </View>

          <Title style={[textStyles.center, spacings.phSm]}>{targetHost}</Title>

          <View style={flexboxStyles.alignCenter}>{!!loading && <Spinner />}</View>
          {!loading && (
            <>
              <View>
                <Text style={[textStyles.center, spacings.phSm, spacings.mbMd]}>
                  <Text fontSize={16} weight="regular">
                    {'Allow '}
                  </Text>
                  <Text fontSize={16} weight="regular" color={colors.heliotrope}>
                    {targetHost}
                  </Text>
                  <Text fontSize={16} weight="regular">
                    {' to switch the network?'}
                  </Text>
                </Text>
                {!!network && !!newNetwork && (
                  <View
                    style={[
                      spacings.pvSm,
                      flexboxStyles.directionRow,
                      flexboxStyles.justifyCenter,
                      flexboxStyles.alignCenter
                    ]}
                  >
                    <Text>{network?.name}</Text>
                    <Text>{'  to  '}</Text>
                    <Text>{newNetwork?.name}</Text>
                  </View>
                )}
              </View>

              <View style={styles.buttonsContainer}>
                <View style={styles.buttonWrapper}>
                  <Button type="danger" onPress={handleDenyButtonPress} text="Deny" />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    type="outline"
                    onPress={handleSwitchNetworkButtonPress}
                    text="Switch Network"
                  />
                </View>
              </View>
            </>
          )}
        </Panel>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default SwitchNetworkRequestScreen
