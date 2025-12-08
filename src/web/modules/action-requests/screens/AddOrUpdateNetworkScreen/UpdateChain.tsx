import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Statuses } from '@ambire-common/interfaces/eventEmitter'
import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import ArrowRightIcon from '@common/assets/svg/ArrowRightIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Alert from '@common/components/Alert'
import Banner from '@common/components/Banner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { SPACING, SPACING_LG, SPACING_MD, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import ManifestImage from '@web/components/ManifestImage'
import NetworkAvailableFeatures from '@web/components/NetworkAvailableFeatures'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useDappInfo from '@web/hooks/useDappInfo'
import useResponsiveActionWindow from '@web/hooks/useResponsiveActionWindow'

import ActionFooter from '../../components/ActionFooter'
import RpcCard from './RpcCard'
import getStyles from './styles'

type UpdateChainProps = {
  handleDenyButtonPress: () => void
  handleUpdateNetwork: () => void
  handleRetryWithDifferentRpcUrl: () => void
  areParamsValid: boolean | null
  statuses: Statuses<'addNetwork' | 'updateNetwork'> & Statuses<string>
  features: NetworkFeature[]
  networkDetails?: AddNetworkRequestParams
  networkAlreadyAdded: Network
  userRequest: UserRequest | undefined
  actionButtonPressedRef: React.MutableRefObject<boolean>
  rpcUrls: string[]
  rpcUrlIndex: number
}

const UpdateChain = ({
  handleDenyButtonPress,
  handleUpdateNetwork,
  handleRetryWithDifferentRpcUrl,
  areParamsValid,
  statuses,
  features,
  networkDetails,
  networkAlreadyAdded,
  userRequest,
  actionButtonPressedRef,
  rpcUrls,
  rpcUrlIndex
}: UpdateChainProps) => {
  const { styles, theme, themeType } = useTheme(getStyles)
  const { t } = useTranslation()
  const { name, icon } = useDappInfo(userRequest)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow({ maxBreakpoints: 2 })

  return (
    <TabLayoutContainer
      width="full"
      header={
        <HeaderAccountAndNetworkInfo
          backgroundColor={
            themeType === THEME_TYPES.DARK
              ? (theme.tertiaryBackground as string)
              : (theme.primaryBackground as string)
          }
        />
      }
      footer={
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleUpdateNetwork}
          resolveButtonText={t('Update network')}
          rejectButtonText={t('Reject')}
          resolveDisabled={
            !areParamsValid ||
            statuses.addNetwork === 'LOADING' ||
            statuses.updateNetwork === 'LOADING' ||
            (features &&
              (features.some((f) => f.level === 'loading') ||
                !!features.find((f) => f.id === 'flagged'))) ||
            actionButtonPressedRef.current
          }
        />
      }
      backgroundColor={theme.quinaryBackground}
    >
      <TabLayoutWrapperMainContent
        style={{
          marginBottom: SPACING_LG * responsiveSizeMultiplier
        }}
        withScroll={false}
      >
        <>
          <View>
            <Text
              weight="medium"
              fontSize={20 * responsiveSizeMultiplier}
              style={{
                marginBottom: SPACING_MD * responsiveSizeMultiplier
              }}
            >
              {t('Update network')}
            </Text>

            <View
              style={[
                styles.dappInfoContainer,
                {
                  marginBottom: SPACING_MD * responsiveSizeMultiplier
                }
              ]}
            >
              <ManifestImage
                uri={icon}
                size={50 * responsiveSizeMultiplier}
                fallback={() => <ManifestFallbackIcon />}
                containerStyle={{
                  marginRight: SPACING_MD * responsiveSizeMultiplier
                }}
              />

              <Trans values={{ name: name || 'The App' }}>
                <Text>
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
              weight="semiBold"
              appearance="secondaryText"
              style={{
                marginBottom: SPACING * responsiveSizeMultiplier
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
                  flexbox.directionRow,
                  flexbox.flex1,
                  flexbox.justifySpaceBetween,
                  {
                    marginBottom: SPACING_SM * responsiveSizeMultiplier,
                    paddingBottom: SPACING_TY * responsiveSizeMultiplier
                  }
                ]}
              >
                <RpcCard title="Old RPC URL" url={networkAlreadyAdded.selectedRpcUrl}>
                  <NetworkAvailableFeatures
                    hideBackgroundAndBorders
                    titleSize={14 * responsiveSizeMultiplier}
                    features={networkAlreadyAdded.features}
                    chainId={networkAlreadyAdded.chainId}
                    withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                    handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
                    responsiveSizeMultiplier={responsiveSizeMultiplier}
                    withScroll
                  />
                </RpcCard>
                <ArrowRightIcon
                  style={{
                    // Align-self center, instead of aligning the parent, to avoid weird behaviour when the
                    // container is scrollable
                    alignSelf: 'center',
                    marginHorizontal: SPACING_MD * responsiveSizeMultiplier
                  }}
                />
                <RpcCard title="New RPC URL" url={networkDetails.selectedRpcUrl} isNew>
                  <NetworkAvailableFeatures
                    hideBackgroundAndBorders
                    titleSize={14 * responsiveSizeMultiplier}
                    features={features}
                    chainId={networkDetails.chainId}
                    withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                    handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
                    responsiveSizeMultiplier={responsiveSizeMultiplier}
                    withScroll
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
                  type="info2"
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
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}
export default React.memo(UpdateChain)
