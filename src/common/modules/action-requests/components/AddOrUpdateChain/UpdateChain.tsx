import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import ArrowRightIcon from '@common/assets/svg/ArrowRightIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Alert from '@common/components/Alert'
import Banner from '@common/components/Banner'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useDappInfo from '@common/hooks/useDappInfo'
import useResponsiveActionWindow from '@common/hooks/useResponsiveActionWindow'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/action-requests/styles/styles'
import spacings, { SPACING, SPACING_MD, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import ManifestImage from '@web/components/ManifestImage'
import NetworkAvailableFeatures from '@web/components/NetworkAvailableFeatures'

import RpcCard from './RpcCard'

type UpdateChainProps = {
  handleRetryWithDifferentRpcUrl: () => void
  areParamsValid: boolean | null
  features: NetworkFeature[]
  networkDetails?: AddNetworkRequestParams
  networkAlreadyAdded: Network
  userRequest: UserRequest | undefined
  actionButtonPressedRef: React.MutableRefObject<boolean>
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
  actionButtonPressedRef,
  rpcUrls,
  rpcUrlIndex
}: UpdateChainProps) => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { name, icon } = useDappInfo(userRequest)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow({ maxBreakpoints: 2 })

  return (
    <>
      <View>
        <Text
          weight="medium"
          fontSize={20 * responsiveSizeMultiplier}
          style={{
            marginBottom: isMobile ? SPACING : SPACING_MD * responsiveSizeMultiplier,
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          {t('Update network')}
        </Text>

        <View
          style={[
            styles.dappInfoContainer,
            {
              marginBottom: isMobile ? SPACING : SPACING_MD * responsiveSizeMultiplier
            }
          ]}
        >
          <ManifestImage
            uri={icon}
            size={50 * responsiveSizeMultiplier}
            fallback={() => <ManifestFallbackIcon />}
            containerStyle={
              isMobile
                ? spacings.mbSm
                : {
                    marginRight: SPACING_MD * responsiveSizeMultiplier
                  }
            }
          />

          <Trans values={{ name: name || 'The App' }}>
            <Text style={isMobile ? text.center : {}}>
              <Text fontSize={20 * responsiveSizeMultiplier} appearance="secondaryText">
                {t('Allow ')}
              </Text>
              <Text fontSize={20 * responsiveSizeMultiplier} weight="semiBold">
                {'{{name}} '}
              </Text>
              <Text fontSize={20 * responsiveSizeMultiplier} appearance="secondaryText">
                {t(`to update ${networkAlreadyAdded.name}`)}
              </Text>
            </Text>
          </Trans>
        </View>
        <Text
          fontSize={16 * responsiveSizeMultiplier}
          weight="medium"
          appearance="secondaryText"
          style={{
            marginBottom: SPACING * responsiveSizeMultiplier,
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          {t('This site is requesting to update your default RPC')}
        </Text>
      </View>

      {(areParamsValid || areParamsValid === null || actionButtonPressedRef.current) &&
      networkDetails ? (
        <>
          <View
            style={[
              isWeb && flexbox.directionRow,
              flexbox.flex1,
              flexbox.justifySpaceBetween,
              {
                marginBottom: SPACING_SM * responsiveSizeMultiplier,
                paddingBottom: SPACING_TY * responsiveSizeMultiplier
              }
            ]}
          >
            <RpcCard title="Old RPC URL" url={networkAlreadyAdded.selectedRpcUrl}>
              {isWeb && (
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
            {isMobile ? (
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
