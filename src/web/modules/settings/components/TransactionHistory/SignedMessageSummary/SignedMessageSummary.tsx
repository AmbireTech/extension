import React, { useMemo } from 'react'
import { ScrollView, View, ViewStyle } from 'react-native'

import { SignedMessage } from '@ambire-common/controllers/activity/types'
import { humanizeMessage } from '@ambire-common/libs/humanizer'
import { ENTRY_POINT_AUTHORIZATION_REQUEST_ID } from '@ambire-common/libs/userOperation/userOperation'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import ExpandableCard from '@common/components/ExpandableCard'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HumanizedVisualization from '@common/components/HumanizedVisualization/HumanizedVisualization'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import FallbackVisualization from '@web/modules/sign-message/screens/SignMessageScreen/FallbackVisualization'

import getStyles from './styles'

interface Props {
  signedMessage: SignedMessage
  style?: ViewStyle
}

const SignedMessageSummary = ({ signedMessage, style }: Props) => {
  const { styles } = useTheme(getStyles)
  const { networks } = useNetworksControllerState()

  const humanizedMessage = useMemo(() => {
    return humanizeMessage(signedMessage)
  }, [signedMessage])

  const network = useMemo(
    () =>
      networks.find((n) => {
        return signedMessage?.content.kind === 'typedMessage' &&
          signedMessage?.content.domain.chainId
          ? n.chainId.toString() === signedMessage?.content.domain.chainId.toString()
          : n.chainId === signedMessage?.chainId
      }),
    [networks, signedMessage]
  )

  const dAppName = useMemo(() => {
    if (signedMessage.fromRequestId === ENTRY_POINT_AUTHORIZATION_REQUEST_ID) {
      return 'Entry Point Authorization'
    }
    if (signedMessage.content.kind === 'authorization-7702') {
      return 'EIP-7702 Authorization'
    }

    return signedMessage.dapp?.name || 'Unknown App'
  }, [signedMessage.dapp?.name, signedMessage.fromRequestId, signedMessage.content.kind])

  const dAppNameTooltipId = useMemo(() => {
    // Filter out spaces and special characters
    const encodedDAppName = dAppName
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase()

    return `${encodedDAppName}-tooltip`
  }, [dAppName])

  return (
    <ExpandableCard
      arrowPosition="right"
      style={style}
      content={
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
          <View style={[flexbox.alignCenter, flexbox.directionRow, flexbox.flex1, spacings.prTy]}>
            {signedMessage.fromRequestId !== ENTRY_POINT_AUTHORIZATION_REQUEST_ID &&
              signedMessage.content.kind !== 'authorization-7702' && (
                <ManifestImage
                  uri={signedMessage?.dapp?.icon || ''}
                  size={32}
                  fallback={() => <ManifestFallbackIcon />}
                  containerStyle={spacings.mrTy}
                />
              )}
            <Text
              fontSize={16}
              weight="semiBold"
              numberOfLines={2}
              dataSet={createGlobalTooltipDataSet({
                id: dAppNameTooltipId,
                content: dAppName
              })}
            >
              {dAppName}
            </Text>
          </View>
          <View style={flexbox.flex1}>
            {new Date(signedMessage.timestamp).toString() !== 'Invalid Date' && (
              <Text fontSize={14} appearance="secondaryText">
                {`${new Date(signedMessage.timestamp).toLocaleDateString()} (${new Date(
                  signedMessage.timestamp
                ).toLocaleTimeString()})`}
              </Text>
            )}
          </View>
          <View style={flexbox.flex1}>
            <Text fontSize={14} appearance="secondaryText">
              {signedMessage.content.kind === 'message' && 'Message'}
              {signedMessage.content.kind === 'typedMessage' && 'Typed Data'}
              {signedMessage.content.kind === 'authorization-7702' && 'EIP-7702'}
            </Text>
          </View>
        </View>
      }
      expandedContent={
        <View style={spacings.mhLg}>
          <View>
            {humanizedMessage?.fullVisualization && (
              <HumanizedVisualization
                data={humanizedMessage?.fullVisualization}
                chainId={network?.chainId || 1n}
                style={[{ marginBottom: SPACING }]}
                isHistory
              />
            )}
          </View>
          <ScrollView contentContainerStyle={styles.rawMessage}>
            <FallbackVisualization
              setHasReachedBottom={() => {}}
              hasReachedBottom
              messageToSign={signedMessage}
            />
          </ScrollView>
        </View>
      }
    />
  )
}

export default React.memo(SignedMessageSummary)
