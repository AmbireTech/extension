import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import ArrowRightIcon from '@common/assets/svg/ArrowRightIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import Alert from '@common/components/Alert'
import Banner from '@common/components/Banner'
import NetworkAvailableFeatures from '@common/components/NetworkAvailableFeatures'
import RequestingDappInfo from '@common/components/RequestingDappInfo'
import Text from '@common/components/Text'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useDappInfo from '@common/hooks/useDappInfo'
import useResponsiveActionWindow from '@common/hooks/useResponsiveActionWindow'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_MD, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import RpcCard from './RpcCard'

type UpdateChainProps = {
  handleRetryWithDifferentRpcUrl: () => void
  areParamsValid: boolean | null
  features: NetworkFeature[]
  networkDetails?: AddNetworkRequestParams
  networkAlreadyAdded: Network
  userRequest: UserRequest | undefined
  isActionButtonPressed: boolean
  rpcUrls: string[]
  rpcUrlIndex: number
}

const UpdateChain = ({
  handleRetryWithDifferentRpcUrl,
  areParamsValid,
  features,
  networkDetails,
  networkAlreadyAdded,
  userRequest,
  isActionButtonPressed,
  rpcUrls,
  rpcUrlIndex
}: UpdateChainProps) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { name, icon } = useDappInfo(userRequest)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow({ maxBreakpoints: 2 })
  const { isCompactLayout, isTwoColumnLayout } = useCompactLayout()

  return (
    <>
      <View>
        <Text
          weight="medium"
          fontSize={20 * responsiveSizeMultiplier}
          style={{ marginBottom: SPACING_MD * responsiveSizeMultiplier }}
        >
          {t('Update network')}
        </Text>
        <RequestingDappInfo
          name={name}
          icon={icon}
          intentText={t('wants to update {{network}}', { network: networkAlreadyAdded.name })}
        />
        <Text
          fontSize={16 * responsiveSizeMultiplier}
          weight="medium"
          appearance="secondaryText"
          style={{
            marginTop: SPACING_MD * responsiveSizeMultiplier,
            marginBottom: SPACING * responsiveSizeMultiplier
          }}
        >
          {t('This site is requesting to update your default RPC')}
        </Text>
      </View>

      {(areParamsValid || areParamsValid === null || isActionButtonPressed) && networkDetails ? (
        <>
          <View
            style={[
              isTwoColumnLayout ? flexbox.directionRow : flexbox.flex1,
              isTwoColumnLayout && flexbox.justifySpaceBetween,
              {
                marginBottom: SPACING_SM * responsiveSizeMultiplier,
                paddingBottom: SPACING_TY * responsiveSizeMultiplier
              }
            ]}
          >
            <RpcCard title="Old RPC URL" url={networkAlreadyAdded.selectedRpcUrl}>
              {isTwoColumnLayout && (
                <NetworkAvailableFeatures
                  hideBackgroundAndBorders
                  titleSize={16 * responsiveSizeMultiplier}
                  features={networkAlreadyAdded.features}
                  chainId={networkAlreadyAdded.chainId}
                  withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                  handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
                  responsiveSizeMultiplier={responsiveSizeMultiplier}
                  withScroll
                />
              )}
            </RpcCard>
            {isCompactLayout ? (
              <View
                style={{
                  width: 32,
                  height: 32,
                  ...flexbox.center,
                  backgroundColor: theme.secondaryBackground,
                  borderRadius: 50,
                  ...spacings.mvSm,
                  ...flexbox.alignSelfCenter
                }}
              >
                <DownArrowIcon color={theme.iconPrimary} />
              </View>
            ) : (
              <ArrowRightIcon
                style={{
                  // Align-self center, instead of aligning the parent, to avoid weird behaviour when the
                  // container is scrollable
                  alignSelf: 'center',
                  marginHorizontal: SPACING_TY * responsiveSizeMultiplier
                }}
                containerColor={theme.secondaryBackground}
                color={theme.iconPrimary}
              />
            )}
            <RpcCard title="New RPC URL" url={networkDetails.selectedRpcUrl} isNew>
              <NetworkAvailableFeatures
                hideBackgroundAndBorders
                titleSize={16 * responsiveSizeMultiplier}
                features={features}
                chainId={networkDetails.chainId}
                withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
                responsiveSizeMultiplier={responsiveSizeMultiplier}
                withScroll
                titleStyle={{ color: theme.success400 }}
              />
            </RpcCard>
          </View>
          <View
            style={{
              marginBottom: SPACING * responsiveSizeMultiplier
            }}
          >
            <Banner
              title={t(
                'Make sure you trust this site and provider. You can change the RPC URL anytime in the network settings.'
              )}
              type="info"
            />
          </View>
        </>
      ) : (
        <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
          <Alert
            title={t('Invalid Request Params')}
            text={t(
              '{{name}} provided invalid params for adding a new network. Try adding it from another App or manually from Settings.',
              {
                name: name || 'The App'
              }
            )}
            type="error"
          />
        </View>
      )}
    </>
  )
}
export default React.memo(UpdateChain)
